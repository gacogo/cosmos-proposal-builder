import React, { Suspense } from "react";
import { ToastContainer } from "react-toastify";

import { Switch, Route } from "wouter";
import { ChainTiles } from "./components/ChainTiles";
import { NetworkDropdown } from "./components/NetworkDropdown";
import { Nav } from "./components/Nav";
import { WalletConnectButton } from "./components/WalletConnectButton";
import { ChainMenu } from "./components/ChainMenu";
import { LayoutFooter } from "./components/LayoutFooter";
import { ProposalsLandingPage } from "./config";

const App: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Nav
        title="Cosmos Proposal Builder"
        showLogo={false}
        rightContent={
          <>
            <div className="mr-[5px] relative hidden sm:flex">
              <Suspense fallback={<div>Loading...</div>}>
                <ChainMenu />
              </Suspense>
            </div>
            <div className="mr-[5px] relative hidden sm:flex">
              <NetworkDropdown />
            </div>
            <div>
              <WalletConnectButton theme="black" />
            </div>
          </>
        }
      />
      <main className="flex-grow mx-auto max-w-7xl min-w-full py-3 sm:py-6 sm:px-6 lg:px-8">
        <Suspense fallback={<div>Loading...</div>}>
          <Switch>
            <Route path="/" component={ChainTiles} />
            <Route path="/:chainName" component={ProposalsLandingPage} />
          </Switch>
        </Suspense>
        <LayoutFooter />
      </main>
      <ToastContainer
        autoClose={false}
        position="bottom-right"
        closeOnClick={false}
        closeButton={true}
        bodyClassName="text-sm font-medium text-gray-900"
      />
    </div>
  );
};

export default App;
