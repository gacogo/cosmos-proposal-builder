import { Fragment, useMemo, useState } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { useQuery } from "@tanstack/react-query";
import { ibcDenomTracesQuery, ibcDenomHashQuery } from "../lib/queries";
import { Coin, DenomTrace } from "../types/bank";
import { selectSinglePathDenomTraces } from "../lib/selectors";
import { useWallet } from "../hooks/useWallet";

const TraceToHash = ({
  path,
  baseDenom,
}: {
  path: string;
  baseDenom: string;
}) => {
  const { api } = useWallet();
  const ibcHashTrace = useQuery(ibcDenomHashQuery(api!, path, baseDenom));
  if (!ibcHashTrace.data) return null;
  return (
    <>
      {ibcHashTrace.data}
      <input type="hidden" name="denom" value={ibcHashTrace.data} />
    </>
  );
};

const formatTraceOrCoin = (trace: DenomTrace | Coin): string => {
  if ((trace as Coin)?.denom) return (trace as Coin).denom;
  if (!trace) return "";
  const { base_denom, path } = trace as DenomTrace;
  return `${base_denom} ${path}`;
};

const IBCDenomInput = () => {
  const { api } = useWallet();
  const [selected, setSelected] = useState<DenomTrace | Coin | null>(null);
  const [query, setQuery] = useState<string>("");
  if (!api) console.error("No api found.");

  const ibcDenomTraces = useQuery(ibcDenomTracesQuery(api!));
  const singleChannelTraces = useMemo(
    () => selectSinglePathDenomTraces(ibcDenomTraces),
    [ibcDenomTraces],
  );
  const filtered =
    query === ""
      ? singleChannelTraces || []
      : (singleChannelTraces || []).filter((d) => {
          return d.base_denom.includes(query) || d.path.includes(query);
        });

  return (
    <div className="block">
      <Combobox value={selected} onChange={setSelected}>
        <div className="relative mt-1">
          <div className="block w-full rounded-md bg-white sm:text-sm">
            <Combobox.Input
              name="denomTrace"
              className="w-full border-none rounded-md py-1.5 pl-3 pr-10  text-gray-900 placeholder:text-gray-400 ring-1 ring-inset ring-gray-300 focus:ring-1 focus:ring-inset focus:ring-red sm:text-sm sm:leading-6 py-3"
              displayValue={(token: DenomTrace) => formatTraceOrCoin(token)}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery("")}
          >
            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-red focus:outline-none sm:text-sm">
              {query.length > 0 && filtered.length === 0 && (
                <Combobox.Option
                  className="relative cursor-default select-none px-4 py-2 text-gray-700"
                  value={{ id: null, denom: query }}
                >
                  Add "{query}"
                </Combobox.Option>
              )}
              {filtered.length === 0 && query !== "" ? (
                <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                  Nothing found.
                </div>
              ) : (
                filtered.map((token) => (
                  <Combobox.Option
                    key={formatTraceOrCoin(token)}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-3 pr-4 ${
                        active ? "bg-teal-600 text-white" : "text-gray-900"
                      }`
                    }
                    value={token}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {formatTraceOrCoin(token)}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? "text-white" : "text-teal-600"
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
      <p className="ml-1 mt-3 text-xs text-gray-600">
        {(selected as DenomTrace)?.base_denom ? (
          <TraceToHash
            baseDenom={(selected as DenomTrace).base_denom}
            path={(selected as DenomTrace).path}
          />
        ) : (selected as Coin)?.denom ? (
          <>
            {(selected as Coin).denom}
            <input
              type="hidden"
              name="denom"
              value={(selected as Coin).denom}
            />
          </>
        ) : null}
      </p>
    </div>
  );
};

export { IBCDenomInput };
