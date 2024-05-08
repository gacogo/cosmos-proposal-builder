/** formats wallet address for display purposes */
export const trimAddress = (address: string, endLength: number = 6): string => {
  if (typeof address !== "string") {
    throw new Error("Invalid  address format");
  }
  const prefix = address.substring(0, 7);
  const suffix = address.substring(address.length - endLength);
  return `${prefix}...${suffix}`;
};
