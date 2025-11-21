"use client";

import { openCategoryForm } from "@/redux/features/category/categorySlice";
import { RootState } from "@/redux/store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

const Sidebar = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  const path = usePathname();
  const dispatch = useDispatch();
  return (
    <>
      <div className="rounded bg-orange-50 dark:bg-gray-800 px-3 py-6 border border-orange-200 dark:border-gray-700 shadow-sm">
        <Link
          className={`block w-full rounded-md py-3 px-4 transition-colors text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-gray-700 min-h-[44px] flex items-center ${
            path === "/support-center" && "bg-orange-100 dark:bg-gray-700 text-orange-600 dark:text-orange-400 font-semibold"
          } `}
          href={"/support-center"}
        >
          {user?.roll === "admin" ? "Dashboard" : "Ticket History"}
        </Link>
        <Link
          className={`block w-full rounded-md py-3 px-4 transition-colors text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-gray-700 min-h-[44px] flex items-center ${
            path === "/support-center/open-tickets" && "bg-orange-100 dark:bg-gray-700 text-orange-600 dark:text-orange-400 font-semibold"
          } `}
          href={"/support-center/open-tickets"}
        >
          Open Tickets
        </Link>
        <Link
          className={`block w-full rounded-md py-3 px-4 transition-colors text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-gray-700 min-h-[44px] flex items-center ${
            path === "/support-center/close-tickets" && "bg-orange-100 dark:bg-gray-700 text-orange-600 dark:text-orange-400 font-semibold"
          } `}
          href={"/support-center/close-tickets"}
        >
          Close Tickets
        </Link>
        <Link
          className={`block w-full rounded-md py-3 px-4 transition-colors text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-gray-700 min-h-[44px] flex items-center ${
            path === "/support-center/notifications" && "bg-orange-100 dark:bg-gray-700 text-orange-600 dark:text-orange-400 font-semibold"
          } `}
          href={"/support-center/notifications"}
        >
          Notificaciones
        </Link>

        {user?.roll === "admin" && (
          <>
            <Link
              onClick={() => dispatch(openCategoryForm(false))}
              className={`block w-full rounded-md py-3 px-4 transition-colors text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-gray-700 min-h-[44px] flex items-center ${
                path === "/support-center/category" && "bg-orange-100 dark:bg-gray-700 text-orange-600 dark:text-orange-400 font-semibold"
              } `}
              href={"/support-center/category"}
            >
              Category
            </Link>

            <Link
              className={`block w-full rounded-md py-3 px-4 transition-colors text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-gray-700 min-h-[44px] flex items-center ${
                path === "/support-center/customer" && "bg-orange-100 dark:bg-gray-700 text-orange-600 dark:text-orange-400 font-semibold"
              } `}
              href={"/support-center/customer"}
            >
              Customers
            </Link>
          </>
        )}

        {user?.roll === "assistance" && (
          <>
            <Link
              onClick={() => dispatch(openCategoryForm(false))}
              className={`block w-full rounded-md py-3 px-4 transition-colors text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-gray-700 min-h-[44px] flex items-center ${
                path === "/support-center/category" && "bg-orange-100 dark:bg-gray-700 text-orange-600 dark:text-orange-400 font-semibold"
              } `}
              href={"/support-center/category"}
            >
              Category
            </Link>
          </>
        )}

        {/* <Link
          className={`block w-full rounded-md py-2 px-4 transition-colors text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-gray-700 ${
            path === "/support-center/settings" && "bg-orange-100 dark:bg-gray-700 text-orange-600 dark:text-orange-400 font-semibold"
          } `}
          href={"/support-center/settings"}
        >
          Settings
        </Link> */}

        {user?.roll === "customer" && (
          <Link href={"/support-center/create-ticket"}>
            <button className="mt-6 w-full rounded-md bg-orange-500 dark:bg-orange-600 py-3 text-white hover:bg-orange-400 dark:hover:bg-orange-700 transition-colors shadow-sm min-h-[48px] text-base font-medium">
              Create an Ticket
            </button>
          </Link>
        )}
      </div>
    </>
  );
};

export default Sidebar;
