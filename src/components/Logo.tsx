"use client";

import { logo } from '@/assets';
import Image from 'next/image';
import React from 'react';

interface LogoProps {}

const Logo: React.FC<LogoProps> = () => {
  return (
    <Image width={150} height={50} src={logo} alt="Antares Panamericana Logo" priority={true} />
  );
};

export default Logo;
