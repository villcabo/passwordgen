import { LengthModel } from '../model/length.model';

export function strengthList(): LengthModel[] {
  let lengthList = [];
  lengthList.push(new LengthModel('basic', 'Basic', 6));
  lengthList.push(new LengthModel('medium', 'Medium', 12));
  lengthList.push(new LengthModel('heroic', 'Heroic', 24));
  lengthList.push(new LengthModel('master', 'Master', 64));
  lengthList.push(new LengthModel('uncollected', 'Uncollected', 128));
  return lengthList;
}

