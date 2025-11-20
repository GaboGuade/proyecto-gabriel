"use client";

import { openCategoryForm } from "@/redux/features/category/categorySlice";
import React, { type FC, useState, useEffect } from "react";
import { BiListPlus } from "react-icons/bi";
import { BsSearch } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";

interface SearchProps {
  level: string;
  category?: boolean;
  isOpen?: boolean;
  onSearch?: (query: string) => void;
}

const Search: FC<SearchProps> = ({ level, category, isOpen, onSearch }) => {
  const dispatch = useDispatch();
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (onSearch) {
      onSearch(searchValue);
    }
  }, [searchValue, onSearch]);

  return (
    <div className="flex justify-between gap-4 sm:items-center flex-col sm:flex-row w-full mb-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white whitespace-nowrap">{level}</h3>
      <div className="flex justify-end space-x-2 w-full lg:w-1/2">
        <div className="relative w-full">
          <input
            onChange={(e) => {
              setSearchValue(e.target.value);
              if (onSearch) {
                onSearch(e.target.value);
              }
            }}
            value={searchValue}
            type="search"
            name="search"
            className="border border-gray-300 dark:border-gray-600 py-2 outline-none focus:border-orange-500 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900 rounded-md w-full px-4 pl-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Buscar..."
          />
          <BsSearch className="absolute top-3 left-3 text-gray-400 dark:text-gray-500" />
        </div>
        {category && !isOpen && (
          <button
            onClick={() => dispatch(openCategoryForm(true))}
            className="bg-orange-500 dark:bg-orange-600 px-4 flex justify-center items-center text-white font-medium rounded-md hover:bg-orange-600 dark:hover:bg-orange-700 transition-colors whitespace-nowrap"
          >
            <BiListPlus color="white" size={20} />
            <span className="ml-1">Crear</span>
          </button>
        )}
      </div>
    </div>
  );
};
export default Search;
