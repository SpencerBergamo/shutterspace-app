type Unit = 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';

interface Props {
  value: number;
  unit: Unit;
}

export default function Milliseconds({ value, unit }: Props): number {

  switch (unit) {
    case 'seconds':
      return value * 1000;
    case 'minutes':
      return value * 1000 * 60;
    case 'hours':
      return value * 1000 * 60 * 60;
    case 'days':
      return value * 1000 * 60 * 60 * 24;
    case 'weeks':
      return value * 1000 * 60 * 60 * 24 * 7;
    case 'months':
      return value * 1000 * 60 * 60 * 24 * 30;
    default:
      throw new Error(`Invalid unit: ${unit}`);
  }
}