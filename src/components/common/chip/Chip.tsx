import React from 'react';

import { ChipSize, ChipState, ChipProps } from './Chip.types';

import clsx from 'clsx';

const style: {
  base: string;
  size: Record<ChipSize, string>;
  state: Record<ChipState, string>;
} = {
  base: 'flex items-center justify-center box-border select-none m-0 cursor-pointer',
  size: {
    sm: 'w-[55px] h-[25px] py-[7px] px-[22px] text-[10px]',
    md: 'w-[75px] h-fit py-[7px] px-[22px] text-[12px]',
  },
  state: {
    inactive: 'bg-bk-10 text-bk-50 border border-solid border-bk-50',
    active: 'bg-primary-400 text-white',
  },
};

const Chip: React.FC<ChipProps> = ({
  size = 'sm',
  state = 'inactive',
  className,
  children,
  ...rest
}) => {
  return (
    <div
      className={clsx(
        style.base,
        style.size[size],
        style.state[state],
        'rounded-[20px]',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Chip;
