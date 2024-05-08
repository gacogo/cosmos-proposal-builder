/* eslint-disable  @typescript-eslint/no-explicit-any */
import axios from "axios";
import fs from "fs";
import path from "path";

/**
 * TODO: have a way to capture logo_urls by name(name suggested by the maintainer of chain
 * eg logo_name = 'agoric-main.png or agoric-main.svg' logos will be a pointer to already existing images
 */

const GIT_REF = "350840e766f7574a120760a13eda4c466413308a";
const RAW_FILE_REPO_URL =
  "https://raw.githubusercontent.com/cosmos/chain-registry";
const REPO_URL = "https://api.github.com/repos/cosmos/chain-registry/contents";
type ApiEntry = {
  address: string;
  provider?: string;
};

type Apis = {
  rpc: ApiEntry[];
  rest: ApiEntry[];
  grpc: ApiEntry[];
};

interface ChainConfig {
  chainName: string;
  chainId: string;
  networkName: string;
  apis: Apis;
  logoURIs?: string[];
  //TODO: Add other properties as needed
}
const cleanupObject = (obj: { [key: string]: any }): ChainConfig => {
  // If it's of the config type, do nothing
  if (isChainConfig(obj)) {
    return obj;
  }

  const cleanedObj: { [key: string]: any } = {};

  const keys = Object.keys(obj);

  // Clean up and convert properties from downloaded JSON object
  for (const key of keys) {
    const camelCaseKey = toCamelCase(key);
    if (camelCaseKey === "networkType") {
      // Special case for networkName
      cleanedObj.networkName = obj[key];
    } else if (camelCaseKey === "compatibleVersions") {
      // Special case for compatibleVersions
      cleanedObj.compatibleVersions = obj[key];
    } else if (camelCaseKey === "keyAlgos") {
      // Special case for keyAlgos
      cleanedObj.keyAlgos = obj[key];
    } else if (Array.isArray(obj[key])) {
      cleanedObj[camelCaseKey] = obj[key].map((entry: any) => {
        const camelCaseEntry: any = {};
        const entryKeys = Object.keys(entry);
        for (const entryKey of entryKeys) {
          const camelCaseEntryKey = toCamelCase(entryKey);
          camelCaseEntry[camelCaseEntryKey] = entry[entryKey];
        }
        return camelCaseEntry;
      });
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      cleanedObj[camelCaseKey] = cleanupObject(obj[key]);
    } else {
      cleanedObj[camelCaseKey] = obj[key];
    }
  }

  return cleanedObj as unknown as ChainConfig;
};
const toCamelCase = (str: string): string => {
  return str.replace(/([-_][a-z])/gi, ($1) => {
    return $1.toUpperCase().replace("-", "").replace("_", "");
  });
};

const isChainConfig = (obj: any): obj is ChainConfig => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "chainName" in obj &&
    "chainId" in obj &&
    "networkName" in obj &&
    "apis" in obj
  );
};
const dw = async (url: string): Promise<any> => {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": `ocular/${process.env.npm_package_version}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching data from URL:", url);
    console.error("Error details:", error);
    throw error;
  }
};

//TODO: read these from a josn file - approved.json
//maintained by dcf - fetch from github repo
const fetchApprovedChains = async (): Promise<string[]> => {
  return ["agoric", "cosmoshub", "osmosis", "juno"];
};

const fetchChainConfig = async (chainName: string): Promise<ChainConfig> => {
  const url = `${RAW_FILE_REPO_URL}/${GIT_REF}/${chainName}/chain.json`;
  const data: string | object = await dw(url);

  let config: ChainConfig;

  if (typeof data === "string") {
    config = JSON.parse(data);
  } else {
    config = cleanupObject(data);
  }
  // to replace this with a better way to get the logo urls
  // config.logo_URIs = [`/public/logo/${chainName}.svg`, `/public/logo/${chainName}.png`];
  config.logoURIs = [
    `/public/logo/${chainName}.svg`,
    `/public/logo/${chainName}.png`,
  ];
  return config;
};

const getOrCreatedir = async (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const downloadImage = async (
  url: string,
  outputPath: string,
): Promise<void> => {
  if (!outputPath) {
    console.error("Error: outputPath is undefined");
    return;
  }
  const response = await axios.get(url, { responseType: "stream" });
  const writer = fs.createWriteStream(outputPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
};

const fetchChainImages = async (chainName: string): Promise<string[]> => {
  const url = `${REPO_URL}/${chainName}/images`;
  const response = await axios.get(url);
  const data = response.data;

  return data
    .filter(
      (file: any) =>
        file.type === "file" &&
        (file.name.endsWith(".png") || file.name.endsWith(".svg")),
    )
    .map((file: any) => file.download_url);
};

const downloadApprovedChainConfigs = async (): Promise<void> => {
  const approvedChains = await fetchApprovedChains();

  for (const chainName of approvedChains) {
    try {
      const chainConfig = await fetchChainConfig(chainName);

      // Check for undefined values
      if (!chainName || !chainConfig.networkName) {
        console.error(
          `Error: chainName or networkName is undefined for chain ${chainName}`,
        );
        continue;
      }

      const configDir = path.join("config", chainName, chainConfig.networkName);

      await getOrCreatedir(configDir);

      const configPath = path.join(configDir, `/chain.json`);
      fs.writeFileSync(configPath, JSON.stringify(chainConfig, null, 2));

      console.log(
        `Chain configuration for ${chainName} downloaded and saved successfully.`,
      );

      const imageUrls = await fetchChainImages(chainName);
      const assetDir = path.join("public", chainName);

      await getOrCreatedir(assetDir);

      const downloadPromises = imageUrls.map(async (imageUrl) => {
        const imageName = path.basename(imageUrl);
        const outputPath = path.join(assetDir, imageName);

        await downloadImage(imageUrl, outputPath);
        console.log(
          `Image ${imageName} for ${chainName} downloaded successfully.`,
        );
      });

      await Promise.all(downloadPromises);
    } catch (error) {
      console.error(`Error processing chain ${chainName}:`, error);
    }
  }
};

const main = async () => {
  try {
    await downloadApprovedChainConfigs();
    console.log(
      "Approved chain configurations and assets downloaded successfully.",
    );
  } catch (error) {
    console.error("Error downloading chain configurations:", error);
  }
};

main().catch(console.error);
