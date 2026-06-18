import { useState, useCallback, useEffect } from 'react';
import { Person, Table, Activity } from '@/types/seating';
import { generateId, saveToStorage, loadFromStorage, autoSeat, extractCompanyShortName } from '@/lib/seating/helpers';

const STORAGE_KEY = 'smart-seating-activity';

const defaultActivity: Activity = {
  id: generateId(),
  name: '活动名称',
  persons: [],
  tables: [],
};

export const useActivityStore = () => {
  const [activity, setActivity] = useState<Activity>(() => 
    loadFromStorage(STORAGE_KEY, defaultActivity)
  );

  // 自动保存
  useEffect(() => {
    saveToStorage(STORAGE_KEY, activity);
  }, [activity]);

  // 更新活动名称
  const updateActivityName = useCallback((name: string) => {
    setActivity(prev => ({ ...prev, name }));
  }, []);

  // 添加人员
  const addPersons = useCallback((persons: Person[]) => {
    setActivity(prev => ({
      ...prev,
      persons: [...prev.persons, ...persons],
    }));
  }, []);

  // 删除人员
  const removePerson = useCallback((personId: string) => {
    setActivity(prev => {
      // 从未分配人员中删除
      const newPersons = prev.persons.filter(p => p.id !== personId);
      
      // 从桌位中删除
      const newTables = prev.tables.map(table => ({
        ...table,
        persons: table.persons.filter(p => p.id !== personId),
      }));
      
      return { ...prev, persons: newPersons, tables: newTables };
    });
  }, []);

  // 清空未分配人员（跳过锁定的人员）
  const clearUnassignedPersons = useCallback(() => {
    setActivity(prev => {
      // 只保留锁定的人员
      const newPersons = prev.persons.filter(p => p.locked);
      return { ...prev, persons: newPersons };
    });
  }, []);

  // 更新人员信息
  const updatePerson = useCallback((personId: string, updates: Partial<Person>) => {
    setActivity(prev => {
      const newPersons = prev.persons.map(p => 
        p.id === personId ? { ...p, ...updates } : p
      );
      
      const newTables = prev.tables.map(table => ({
        ...table,
        persons: table.persons.map(p => 
          p.id === personId ? { ...p, ...updates } : p
        ),
      }));
      
      return { ...prev, persons: newPersons, tables: newTables };
    });
  }, []);

  // 批量创建桌位
  const createTables = useCallback((count: number, capacity: number, prefix: string) => {
    const newTables: Table[] = [];
    for (let i = 1; i <= count; i++) {
      newTables.push({
        id: generateId(),
        name: `${prefix}${i}`,
        capacity,
        persons: [],
      });
    }
    setActivity(prev => ({
      ...prev,
      tables: [...prev.tables, ...newTables],
    }));
  }, []);

  // 删除桌位
  const removeTable = useCallback((tableId: string) => {
    setActivity(prev => {
      const table = prev.tables.find(t => t.id === tableId);
      if (!table) return prev;
      
      // 将桌位中的人员移回未分配池
      return {
        ...prev,
        tables: prev.tables.filter(t => t.id !== tableId),
        persons: [...prev.persons, ...table.persons],
      };
    });
  }, []);

  // 更新桌位
  const updateTable = useCallback((tableId: string, updates: Partial<Table>) => {
    setActivity(prev => ({
      ...prev,
      tables: prev.tables.map(t => 
        t.id === tableId ? { ...t, ...updates } : t
      ),
    }));
  }, []);

  // 移动人员到桌位
  const movePersonToTable = useCallback((
    personId: string, 
    targetTableId: string, 
    sourceTableId?: string
  ) => {
    setActivity(prev => {
      let person: Person | undefined;
      
      // 从源位置移除人员
      let newPersons = prev.persons;
      let newTables = [...prev.tables];
      
      if (sourceTableId) {
        // 从桌位移除
        const sourceTable = newTables.find(t => t.id === sourceTableId);
        if (sourceTable) {
          person = sourceTable.persons.find(p => p.id === personId);
          newTables = newTables.map(t => 
            t.id === sourceTableId 
              ? { ...t, persons: t.persons.filter(p => p.id !== personId) }
              : t
          );
        }
      } else {
        // 从未分配池移除
        person = prev.persons.find(p => p.id === personId);
        newPersons = prev.persons.filter(p => p.id !== personId);
      }
      
      if (!person) return prev;
      
      // 添加到目标桌位
      const targetTable = newTables.find(t => t.id === targetTableId);
      if (!targetTable) return prev;
      
      // 如果目标桌位已满，随机挤出一个人
      let removedPerson: Person | undefined;
      if (targetTable.persons.length >= targetTable.capacity) {
        const randomIndex = Math.floor(Math.random() * targetTable.persons.length);
        removedPerson = targetTable.persons[randomIndex];
        newTables = newTables.map(t => 
          t.id === targetTableId 
            ? { ...t, persons: t.persons.filter((_, i) => i !== randomIndex) }
            : t
        );
      }
      
      // 添加人员到目标桌位
      newTables = newTables.map(t => 
        t.id === targetTableId 
          ? { ...t, persons: [...t.persons, person!] }
          : t
      );
      
      // 如果有被挤出的人员，添加到未分配池
      if (removedPerson) {
        newPersons = [...newPersons, removedPerson];
      }
      
      return { ...prev, persons: newPersons, tables: newTables };
    });
  }, []);

  // 从桌位移回未分配池
  const movePersonToPool = useCallback((personId: string, sourceTableId: string) => {
    setActivity(prev => {
      const sourceTable = prev.tables.find(t => t.id === sourceTableId);
      if (!sourceTable) return prev;
      
      const person = sourceTable.persons.find(p => p.id === personId);
      if (!person) return prev;
      
      return {
        ...prev,
        persons: [...prev.persons, person],
        tables: prev.tables.map(t => 
          t.id === sourceTableId 
            ? { ...t, persons: t.persons.filter(p => p.id !== personId) }
            : t
        ),
      };
    });
  }, []);

  // 桌位内换位
  const reorderInTable = useCallback((tableId: string, oldIndex: number, newIndex: number) => {
    setActivity(prev => ({
      ...prev,
      tables: prev.tables.map(t => {
        if (t.id !== tableId) return t;
        
        const newPersons = [...t.persons];
        const [removed] = newPersons.splice(oldIndex, 1);
        newPersons.splice(newIndex, 0, removed);
        
        return { ...t, persons: newPersons };
      }),
    }));
  }, []);

  // 清空所有排座（跳过锁定的桌位）
  const clearSeating = useCallback(() => {
    setActivity(prev => {
      const allPersons = [...prev.persons];
      prev.tables.forEach(table => {
        // 跳过桌员锁定的桌位
        if (!table.seatLock) {
          allPersons.push(...table.persons);
        }
      });
      
      return {
        ...prev,
        persons: allPersons,
        tables: prev.tables.map(t => 
          t.seatLock ? t : { ...t, persons: [] }
        ),
      };
    });
  }, []);

  // 清空所有名单（保留桌位结构，跳过锁定的桌位）
  const clearPersons = useCallback(() => {
    setActivity(prev => ({
      ...prev,
      persons: [],
      tables: prev.tables.map(t => 
        t.seatLock ? t : { ...t, persons: [] }
      ),
    }));
  }, []);

  // 清空所有桌位
  const clearTables = useCallback(() => {
    setActivity(prev => {
      // 将所有桌位中的人员移回未分配池
      const allPersons = [...prev.persons];
      prev.tables.forEach(table => {
        allPersons.push(...table.persons);
      });
      
      return {
        ...prev,
        persons: allPersons,
        tables: [],
      };
    });
  }, []);

  // 执行自动排座（保留已排座人员，只排未分配人员）
  const performAutoSeat = useCallback(() => {
    setActivity(prev => {
      // 只取未分配人员，不调动已排座人员
      const unseatedPersons = [...prev.persons];
      
      // 对桌位进行自动排座（保留已排座人员）
      const newTables = autoSeat(unseatedPersons, prev.tables);
      
      // 计算仍未能排座的人员
      const seatedIds = new Set<string>();
      newTables.forEach(table => {
        table.persons.forEach(p => seatedIds.add(p.id));
      });
      const stillUnseated = unseatedPersons.filter(p => !seatedIds.has(p.id));
      
      return {
        ...prev,
        persons: stillUnseated,
        tables: newTables,
      };
    });
  }, []);

  // 导入排座数据
  const importSeatingData = useCallback((data: unknown): boolean => {
    try {
      const root = (data && typeof data === 'object' ? data : {}) as {
        activity?: unknown;
        tables?: unknown;
      };
      const name = (typeof root.activity === 'string' && root.activity) || '导入的活动';
      const rawTables = Array.isArray(root.tables) ? root.tables : [];
      const tables: Table[] = rawTables.map((tableRaw, index) => {
        const t = (tableRaw && typeof tableRaw === 'object' ? tableRaw : {}) as {
          name?: unknown;
          capacity?: unknown;
          persons?: unknown;
        };
        const rawPersons = Array.isArray(t.persons) ? t.persons : [];
        return {
          id: generateId(),
          name: (typeof t.name === 'string' && t.name) || `桌位${index + 1}`,
          capacity: typeof t.capacity === 'number' ? t.capacity : 10,
          persons: rawPersons.map((personRaw) => {
            const p = (personRaw && typeof personRaw === 'object' ? personRaw : {}) as Record<string, unknown>;
            const company = typeof p.company === 'string' ? p.company : '';
            return {
              id: (typeof p.id === 'string' && p.id) || generateId(),
              name: typeof p.name === 'string' ? p.name : '',
              company,
              companyShort: extractCompanyShortName(company),
              title: typeof p.title === 'string' ? p.title : '',
              phone: typeof p.phone === 'string' ? p.phone : '',
              tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
            };
          }),
        };
      });
      
      setActivity({
        id: generateId(),
        name,
        persons: [],
        tables,
      });
      
      return true;
    } catch {
      return false;
    }
  }, []);

  // 交换两个桌位的人员（用于快速换桌功能）
  const swapPersonsBetweenTables = useCallback((
    personId: string,
    sourceTableId: string,
    targetTableId: string
  ) => {
    setActivity(prev => {
      const sourceTable = prev.tables.find(t => t.id === sourceTableId);
      const targetTable = prev.tables.find(t => t.id === targetTableId);
      
      if (!sourceTable || !targetTable) return prev;
      
      const sourcePerson = sourceTable.persons.find(p => p.id === personId);
      if (!sourcePerson) return prev;
      
      // 如果目标桌未满，直接移动
      if (targetTable.persons.length < targetTable.capacity) {
        return {
          ...prev,
          tables: prev.tables.map(t => {
            if (t.id === sourceTableId) {
              return { ...t, persons: t.persons.filter(p => p.id !== personId) };
            }
            if (t.id === targetTableId) {
              return { ...t, persons: [...t.persons, sourcePerson] };
            }
            return t;
          }),
        };
      }
      
      // 如果目标桌已满，交换最后一个人员
      const lastPerson = targetTable.persons[targetTable.persons.length - 1];
      
      return {
        ...prev,
        tables: prev.tables.map(t => {
          if (t.id === sourceTableId) {
            return { ...t, persons: t.persons.map(p => p.id === personId ? lastPerson : p) };
          }
          if (t.id === targetTableId) {
            return { 
              ...t, 
              persons: [...t.persons.slice(0, -1), sourcePerson] 
            };
          }
          return t;
        }),
      };
    });
  }, []);

  // 切换桌员锁定
  const toggleSeatLock = useCallback((tableId: string) => {
    setActivity(prev => ({
      ...prev,
      tables: prev.tables.map(t => {
        if (t.id !== tableId) return t;
        const newSeatLock = !t.seatLock;
        return { 
          ...t, 
          seatLock: newSeatLock,
          // 锁定时同步更新成员的 locked 状态
          persons: t.persons.map(p => ({ ...p, locked: newSeatLock }))
        };
      }),
    }));
  }, []);

  // 切换桌位锁定
  const togglePositionLock = useCallback((tableId: string) => {
    setActivity(prev => ({
      ...prev,
      tables: prev.tables.map(t => 
        t.id === tableId ? { ...t, positionLock: !t.positionLock } : t
      ),
    }));
  }, []);

  // 一键解锁全部桌员锁定
  const unlockAllSeatLocks = useCallback(() => {
    setActivity(prev => ({
      ...prev,
      tables: prev.tables.map(t => ({
        ...t,
        seatLock: false,
        persons: t.persons.map(p => ({ ...p, locked: false }))
      })),
    }));
  }, []);

  // 一键锁定全部桌员
  const lockAllSeatLocks = useCallback(() => {
    setActivity(prev => ({
      ...prev,
      tables: prev.tables.map(t => ({
        ...t,
        seatLock: true,
        persons: t.persons.map(p => ({ ...p, locked: true }))
      })),
    }));
  }, []);

  // 检查是否全部锁定
  const isAllSeatLocked = useCallback((): boolean => {
    return activity.tables.length > 0 && activity.tables.every(t => t.seatLock);
  }, [activity.tables]);

  // 桌位排序（支持位置锁定和部分重新编号）
  // 规则：目标位置之前的桌号保持不变，从目标位置开始按顺序重新编号
  // 每组固定容量为6个（A1-A6, B1-B6, C1-C6...）
  // 例：C2拖到A3位置 → A1,A2不变，C2变A3，原A3变A4，原A4变A5...原A6变B1，原B1变B2...
  const reorderTables = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    setActivity(prev => {
      const tables = [...prev.tables];
      
      // 获取要移动的桌位
      const movingTable = tables[fromIndex];
      if (!movingTable) return prev;
      
      // 移动桌位到新位置
      tables.splice(fromIndex, 1);
      tables.splice(toIndex, 0, movingTable);
      
      // 固定每组容量为6个
      const groupSize = 6;
      
      // 解析桌号
      const parseTableName = (name: string): { prefix: string; number: number } => {
        const match = name.match(/^(.*?)(\d+)$/);
        if (match) {
          return { prefix: match[1], number: parseInt(match[2], 10) };
        }
        return { prefix: name, number: 0 };
      };
      
      // 前缀递增：A → B → C → ... → Z → AA → AB → ...
      const incrementPrefix = (prefix: string): string => {
        const prefixes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (prefix.length === 1) {
          const index = prefixes.indexOf(prefix);
          if (index < 25) {
            return prefixes[index + 1];
          }
          return 'AA';
        }
        // 多字母前缀
        const lastChar = prefix[prefix.length - 1];
        const rest = prefix.slice(0, -1);
        const lastIndex = prefixes.indexOf(lastChar);
        if (lastIndex < 25) {
          return rest + prefixes[lastIndex + 1];
        }
        return incrementPrefix(rest) + 'A';
      };
      
      // 生成下一个桌号
      const getNextTableName = (currentName: string, groupSz: number): string => {
        const { prefix, number } = parseTableName(currentName);
        if (number < groupSz) {
          return `${prefix}${number + 1}`;
        }
        // 需要切换到下一个前缀
        const nextPrefix = incrementPrefix(prefix);
        return `${nextPrefix}1`;
      };
      
      // 使用 for 循环逐步处理，从目标位置开始重新编号
      const renumberedTables: Table[] = [...tables];
      for (let index = toIndex; index < renumberedTables.length; index++) {
        if (index === 0) {
          // 如果目标是第一个位置，从 A1 开始
          renumberedTables[index] = { ...renumberedTables[index], name: 'A1' };
        } else {
          // 基于前一个桌号递增
          const prevTableName = renumberedTables[index - 1].name;
          const newName = getNextTableName(prevTableName, groupSize);
          renumberedTables[index] = { ...renumberedTables[index], name: newName };
        }
      }
      
      return { ...prev, tables: renumberedTables };
    });
  }, []);

  // 桌内成员向上移动
  const movePersonUp = useCallback((tableId: string, personIndex: number) => {
    if (personIndex <= 0) return;
    setActivity(prev => ({
      ...prev,
      tables: prev.tables.map(t => {
        if (t.id !== tableId) return t;
        const newPersons = [...t.persons];
        [newPersons[personIndex - 1], newPersons[personIndex]] = [newPersons[personIndex], newPersons[personIndex - 1]];
        return { ...t, persons: newPersons };
      }),
    }));
  }, []);

  // 桌内成员向下移动
  const movePersonDown = useCallback((tableId: string, personIndex: number) => {
    setActivity(prev => ({
      ...prev,
      tables: prev.tables.map(t => {
        if (t.id !== tableId) return t;
        if (personIndex >= t.persons.length - 1) return t;
        const newPersons = [...t.persons];
        [newPersons[personIndex], newPersons[personIndex + 1]] = [newPersons[personIndex + 1], newPersons[personIndex]];
        return { ...t, persons: newPersons };
      }),
    }));
  }, []);

  return {
    activity,
    updateActivityName,
    addPersons,
    removePerson,
    clearUnassignedPersons,
    updatePerson,
    createTables,
    removeTable,
    updateTable,
    movePersonToTable,
    movePersonToPool,
    reorderInTable,
    clearSeating,
    clearPersons,
    clearTables,
    performAutoSeat,
    importSeatingData,
    swapPersonsBetweenTables,
    toggleSeatLock,
    togglePositionLock,
    unlockAllSeatLocks,
    lockAllSeatLocks,
    isAllSeatLocked,
    reorderTables,
    movePersonUp,
    movePersonDown,
  };
};
