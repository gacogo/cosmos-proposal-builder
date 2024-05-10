import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { makeSignAndBroadcast } from "./signAndBroadcast";
import { toast } from "react-toastify";
import { EncodeObject } from "@cosmjs/proto-signing";
import { makeFeeObject } from "./messageBuilder";

vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
    loading: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@paralleldrive/cuid2", () => ({
  createId: vi.fn(),
}));

describe("makeSignAndBroadcast Unit Tests", () => {
  let mockStargateClient: { simulate: Mock; signAndBroadcast: Mock };
  let walletAddress: string;
  let explorerUrl: string | null;
  let proposalMsg: EncodeObject;

  beforeEach(() => {
    vi.resetAllMocks();

    mockStargateClient = {
      simulate: vi.fn(),
      signAndBroadcast: vi.fn(),
    };

    walletAddress = "agoric12345";
    explorerUrl = null,
    proposalMsg = {
      typeUrl: "mock-type-url",
      value: "mock-value",
    };
    vi.mock("@paralleldrive/cuid2", () => ({
      createId: () => "mock-unique-id",
    }));
  });

  it("should broadcast a transaction successfully", async () => {
    const MOCK_GAS = 1000;
    const mockTxResult = {
      code: 0,
      events: [],
    };

    mockStargateClient.simulate.mockResolvedValue(MOCK_GAS);
    mockStargateClient.signAndBroadcast.mockResolvedValue(mockTxResult);

    const signAndBroadcast = makeSignAndBroadcast(
      // @ts-expect-error mock stargateClient
      mockStargateClient,
      walletAddress,
      explorerUrl,
    );

    const res = await signAndBroadcast(proposalMsg, "proposal");
    expect(res).toEqual(mockTxResult);
    expect(mockStargateClient.simulate).toHaveBeenCalledWith(
      walletAddress,
      [proposalMsg],
      undefined, // memo
    );
    expect(mockStargateClient.signAndBroadcast).toHaveBeenCalledWith(
      walletAddress,
      [proposalMsg],
      makeFeeObject({ gas: Math.ceil(MOCK_GAS * 1.3) }),
    );
    expect(toast.update).toHaveBeenCalledWith(
      "mock-unique-id",
      expect.objectContaining({
        type: "success",
        render: expect.any(Function),
      }),
    );
  });

  it("should throw when broadcasting fails", async () => {
    const error = new Error("Network error");
    mockStargateClient.simulate.mockRejectedValue(error);

    const signAndBroadcast = makeSignAndBroadcast(
      // @ts-expect-error mock stargateClient
      mockStargateClient,
      walletAddress,
      explorerUrl    
    );

    await expect(signAndBroadcast(proposalMsg, "proposal")).rejects.toThrow(
      "Network error",
    );
    expect(toast.update).toHaveBeenCalledWith(
      "mock-unique-id",
      expect.objectContaining({
        type: "error",
        render: "Network error",
      }),
    );
  });
});
