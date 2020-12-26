export interface TaskOperation {
  op: string;
  path: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}
