type QuantityRendererProps = {
  count: number;
  image: string;
  alt?: string;
  className?: string;
  imageClassName?: string;
  maxItemsPerRow?: number;
  maxRows?: number;
};

const QuantityRenderer = ({
  count,
  image,
  alt = "Item",
  className = "",
  imageClassName = "",
}: QuantityRendererProps) => {
  return (
    <div
      className={`flex flex-wrap gap-1 md:max-w-[200px] xl:max-w-[350px] ${className}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <img
          key={i}
          src={image}
          alt={`${alt} ${i + 1}`}
          className={`w-12 h-12 object-contain hover:scale-125 transition-transform ${imageClassName}`}
        />
      ))}
    </div>
  );
};

export default QuantityRenderer;
