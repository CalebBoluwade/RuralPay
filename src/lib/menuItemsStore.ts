export interface MenuItemBase {
  label: string;
  icon?: any;
  onPress: () => void;
}

let _items: MenuItemBase[] = [];

export const menuItemsStore = {
  set: (items: MenuItemBase[]) => { _items = items; },
  get: () => _items,
};
