export class LengthModel {
  key: string;
  name: string;
  length: number;

  constructor(key?: string, name?: string, length?: number) {
    this.key = key;
    this.name = name;
    this.length = length;
  }
}
