import { iconName } from '../components/Icon';

describe('iconName', () => {
  it('passes through known Ionicons names unchanged', () => {
    expect(iconName('moon-outline')).toBe('moon-outline');
    expect(iconName('heart-outline')).toBe('heart-outline');
  });

  it('passes through legacy names (cast-only wrapper)', () => {
    expect(iconName('more')).toBe('more');
    expect(iconName('more-horizontal')).toBe('more-horizontal');
  });
});
