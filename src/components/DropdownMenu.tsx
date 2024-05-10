import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { classNames } from "../utils/classNames";

interface DropdownMenuProps {
  title: string;
  items: {
    label: string;
    href?: string;
    onClick?: () => void;
    image?: string;
  }[];
  buttonStyle?: string;
  dropdownItemStyle?: string;
  label: string;
  showImage?: boolean;
  status?: "loading" | "error" | "active" | "default";
}

const statusColors = {
  active: "bg-green",
  loading: "bg-yellow-500",
  error: "bg-red-500",
  default: "bg-gray-500",
};

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  title,
  items,
  label,
  status,
  buttonStyle,
  dropdownItemStyle,
  showImage,
}) => {
  return (
    <Menu as="div" className="relative text-left">
      <div>
        <Menu.Button
          className={classNames(
            "flex w-full justify-between rounded-md bg-white px-3 py-3 text-sm font-semibold text-black ring-1 ring-inset ring-light shadow-sm hover:bg-gray-50",
            buttonStyle ? buttonStyle : "",
          )}
        >
          {status && (
            <div
              className={classNames(
                "w-1.5 h-1.5 rounded-full inline-block mr-2.5 self-center",
                statusColors[status],
              )}
            />
          )}
          <span className={classNames("", !status ? "mx-auto" : "")}>
            {title}
          </span>
          <ChevronDownIcon
            className="-mr-1 ml-2.5 h-5 w-5 text-black"
            aria-hidden="true"
          />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={classNames(
            "absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
            status === "loading" ? "opacity-50 pointer-events-none" : "",
            dropdownItemStyle ? dropdownItemStyle : "",
          )}
        >
          <div className="py-1">
            {items.map((item) => (
              <Menu.Item key={item.label}>
                {({ active }) => (
                  <a
                    href={item.href}
                    onClick={item.onClick}
                    className={classNames(
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                      "block px-4 py-2 text-sm",
                    )}
                  >
                    {showImage && item.image && (
                      <img
                        src={item.image}
                        alt={item.label}
                        className="inline w-5 h-5 mr-2"
                      />
                    )}
                    {item.label}
                  </a>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export { DropdownMenu };