interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'h-4 w-4 border-2', md: 'h-7 w-7 border-2', lg: 'h-12 w-12 border-[3px]' };

export default function Spinner({ size = 'md', className = '' }: Props) {
  return (
    <div
      className={`animate-spin rounded-full border-primary-200 border-t-primary ${sizeMap[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
