"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { CSSProperties, ReactNode, useCallback, useState } from "react";

// Local imports
import { cn } from "@/lib/utils";
import SearchInput from "./inputs/search-input";
import useDebounce from "@/shared/hooks/use-debounce";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ValueLabel = {
  label: string;
  value: string;
};

type FilterParams = {
  key: string;
  value: string | string[];
};

interface SearchFilterProps {
  searchPlaceholder?: string;
  debounceDuration?: number;
  containerClassName?: string;
  recordsName?: string | ReactNode;
  handleSearch?: (keyword: string) => void;
  onFiltersChange?: (filter: FilterParams) => void;
  filterOptions?: {
    options: ValueLabel[];
    key: string;
    filterPlaceholder?: string;
    className?: string;
    style?: CSSProperties;
    disabled?: boolean;
    value?: string;
  }[];
}

const SearchFilters = ({
  handleSearch,
  debounceDuration = 400,
  searchPlaceholder,
  filterOptions,
  containerClassName = "",
  onFiltersChange,
}: SearchFilterProps) => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();

  //   debounce
  useDebounce(
    () => {
      handleSearch?.(search);
    },
    [search],
    debounceDuration,
  );

  // Get a new searchParams string by merging the current
  // searchParams with a provided key/value pair
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  const handleFilterChange = (filter: FilterParams) => {
    onFiltersChange?.(filter);

    // Update the URL query string
    router.push(`?${createQueryString(filter.key, filter.value as string)}`);
  };

  return (
    <>
      <div
        className={cn(
          "flex md:flex-wrap justify-center lg:justify-between items-center fade-in",
          containerClassName,
        )}
      >
        <div
          className={cn(
            "flex w-full md:w-fit flex-col gap-2 md:gap-0 md:flex-row md:items-center",
          )}
        >
          {filterOptions?.length && (
            <>
              {filterOptions?.map((option, i) => (
                <div
                  key={option?.key}
                  style={{
                    // width: "100px",
                    ...option?.style,
                  }}
                  className={option?.className + " w-full sm:w-[200px]"}
                >
                  <Select
                    disabled={option?.disabled}
                    value={option?.value || ""}
                    onValueChange={(value) => {
                      handleFilterChange({
                        key: option?.key,
                        value,
                      });
                    }}
                  >
                    <SelectTrigger
                      variant="default"
                      className={cn(
                        "border-lemon-400 bg-lemon-200 !text-lemon-700 md:rounded-lg sm:text-lg sm:min-h-12",
                        {
                          "rounded-r-none": i === 0,
                          "rounded-none": i !== 0,
                        },
                      )}
                    >
                      <SelectValue placeholder={option?.filterPlaceholder} />
                    </SelectTrigger>
                    <SelectContent className="border-lemon-400 bg-lemon-200 text-lemon-700 max-h-[400px]">
                      {option?.options.map((item) => (
                        <SelectItem
                          key={item.value}
                          value={item.value}
                          className="focus:bg-lemon-300 focus:text-lemon-800 text-lg"
                        >
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </>
          )}
        </div>
        <div className={cn("flex-1 hidden sm:block")}>
          {searchPlaceholder && (
            <SearchInput
              type="search"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              className="border-lemon-400 sm:min-h-12 rounded-l-none bg-lemon-50 text-lg text-lemon-600 placeholder:text-lemon-600"
            />
          )}
        </div>
      </div>
    </>
  );
};

export default SearchFilters;
