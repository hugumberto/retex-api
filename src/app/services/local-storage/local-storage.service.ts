export interface ILocalStorageService {
  init<T>(fn: () => Promise<T>): Promise<T>;

  set(data: Record<string, any>, override?: boolean): Promise<void>;

  get<T = any>(): Promise<T>;
}
