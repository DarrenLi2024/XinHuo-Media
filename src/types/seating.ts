export interface Person {
  id: string;
  name: string;
  company: string;
  companyShort?: string;  // 公司简称
  title: string;
  phone: string;
  tags: string[];
  tableNumber?: string;   // 预设桌号
  locked?: boolean;       // 是否被桌员锁定
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  persons: Person[];
  seatLock?: boolean;      // 桌员锁定（锁定桌内全部成员）
  positionLock?: boolean;  // 桌位锁定（锁定桌位位置）
}

export interface Activity {
  id: string;
  name: string;
  persons: Person[];
  tables: Table[];
}

export interface SeatingData {
  activity: string;
  tables: {
    name: string;
    capacity: number;
    persons: Person[];
  }[];
}

export interface ImportResult {
  success: boolean;
  persons: Person[];
  errors: string[];
}

export type DragItem = {
  type: 'person' | 'table-person';
  person: Person;
  tableId?: string;
};
