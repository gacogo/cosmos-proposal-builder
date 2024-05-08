import { Link } from "wouter";
import { useChain } from "../hooks/useChain";

const selectChainTitle = "Cosmos Proposal Builder";
const selectChainDescription =
  "Select a chain or protocol to begin building a proposal.";

const ChainTiles = () => {
  const { availableChains } = useChain();

  return (
    <div className="w-full max-w-7xl px-2 py-2 sm:px-0 m-auto">
      <div className="flex flex-col min-w-full rounded-xl bg-white p-3">
        <div className="py-2 px-2">
          <div>
            <h2 className="text-[28px] font-semibold text-blue">
              {selectChainTitle}
            </h2>
            <p className="mt-4 text-sm text-grey">{selectChainDescription}</p>
          </div>
          <div className="mt-[30px] space-y-3 border-t border-dotted border-lightgrey py-[30px] sm:border-t sm:pb-0">
            <ul
              role="list"
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            >
              {availableChains.map(({ value, label, image }) => (
                <li
                  key={value}
                  className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-gray-50 text-center shadow-md hover:bg-gray-100"
                >
                  <Link href={`/${value}`} className="flex flex-1 flex-col p-8">
                    <img
                      className="mx-auto h-28 w-28 flex-shrink-0"
                      src={image}
                      alt={`${label} logo`}
                    />
                    <span className="font-medium -mb-4 mt-5">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ChainTiles };
