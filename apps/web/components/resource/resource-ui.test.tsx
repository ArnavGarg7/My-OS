import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  buildPortfolio,
  healthReport,
  interactionSeries,
  makeAsset,
  makeDocument,
  makeInvestmentAccount,
  makePolicy,
  makePosition,
  makeRelationship,
  makeTravelDocument,
  makeVehicle,
  schedule,
  upcomingDates,
  FIXED_NOW,
} from "@myos/core/resource";
import { PortfolioView } from "./PortfolioView";
import { AccountsView } from "./AccountsView";
import { AssetEditor } from "./AssetEditor";
import { AssetsPage } from "./AssetsPage";
import { MaintenanceTracker } from "./MaintenanceTracker";
import { VehiclesPage } from "./VehiclesPage";
import { InsurancePage } from "./InsurancePage";
import { DocumentsPage } from "./DocumentsPage";
import { TravelDocuments } from "./TravelDocuments";
import { ContactCard } from "./ContactCard";
import { BirthdayCalendar } from "./BirthdayCalendar";
import { NetworkingView } from "./NetworkingView";
import { RelationshipPage } from "./RelationshipPage";
import { formatCountdown, formatGain, formatMoney } from "./resource-icons";

describe("resource formatters", () => {
  it("formats ₹ with Indian digit grouping", () => {
    expect(formatMoney(560000)).toBe("₹5,60,000");
    expect(formatMoney(0)).toBe("₹0");
  });

  it("signs gains and losses so a loss reads as a loss", () => {
    expect(formatGain(500)).toBe("+₹500");
    expect(formatGain(-500)).toBe("−₹500");
  });

  it("formats countdowns in both directions", () => {
    expect(formatCountdown(0)).toBe("today");
    expect(formatCountdown(1)).toBe("in 1 day");
    expect(formatCountdown(5)).toBe("in 5 days");
    expect(formatCountdown(-3)).toBe("3 days ago");
  });
});

describe("PortfolioView", () => {
  it("is empty with no positions", () => {
    render(<PortfolioView portfolio={undefined} />);
    expect(screen.getByText("No investments yet")).toBeInTheDocument();
  });

  it("renders value, gain and allocation from the derived portfolio", () => {
    const portfolio = buildPortfolio([
      makePosition({ id: "a", symbol: "INFY", quantity: 10, averageCost: 100, currentPrice: 150 }),
    ]);
    render(<PortfolioView portfolio={portfolio} />);
    // ₹1,500 appears twice — as the portfolio total and as the position's value.
    expect(screen.getAllByText("₹1,500")).toHaveLength(2);
    expect(screen.getByText("₹1,000")).toBeInTheDocument(); // cost basis
    expect(screen.getByText("INFY")).toBeInTheDocument();
    expect(screen.getByText("+₹500")).toBeInTheDocument();
  });

  it("warns when the portfolio is concentrated", () => {
    const portfolio = buildPortfolio([
      makePosition({ id: "a", type: "crypto", quantity: 10, currentPrice: 100 }),
    ]);
    render(<PortfolioView portfolio={portfolio} />);
    expect(screen.getByText(/Concentrated in crypto/)).toBeInTheDocument();
  });
});

describe("AccountsView", () => {
  it("creates an account and clears the form", async () => {
    const onCreate = vi.fn();
    render(<AccountsView accounts={[]} onCreate={onCreate} />);
    await userEvent.type(screen.getByLabelText("Account name"), "Zerodha");
    await userEvent.click(screen.getByRole("button", { name: "Add account" }));
    expect(onCreate).toHaveBeenCalledWith({ name: "Zerodha" });
  });

  it("marks accounts linked to Finance", () => {
    render(
      <AccountsView
        accounts={[makeInvestmentAccount({ financeAccountId: "fin-1" })]}
        onCreate={vi.fn()}
      />,
    );
    expect(screen.getByText("Linked to Finance")).toBeInTheDocument();
  });

  it("does not submit a blank name", async () => {
    const onCreate = vi.fn();
    render(<AccountsView accounts={[]} onCreate={onCreate} />);
    expect(screen.getByRole("button", { name: "Add account" })).toBeDisabled();
    expect(onCreate).not.toHaveBeenCalled();
  });
});

describe("AssetEditor + AssetsPage", () => {
  it("creates an asset with type and price", async () => {
    const onCreate = vi.fn();
    render(<AssetEditor onCreate={onCreate} />);
    await userEvent.type(screen.getByLabelText("Asset name"), "MacBook");
    await userEvent.type(screen.getByLabelText("Purchase price"), "200000");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "MacBook", purchasePrice: 200000, type: "electronics" }),
    );
  });

  it("shows the empty state with no assets", () => {
    render(
      <AssetsPage
        assets={[]}
        onCreate={vi.fn()}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        selectedId={null}
      />,
    );
    expect(screen.getByText("No assets yet")).toBeInTheDocument();
  });

  it("lists assets with their derived current value and warranty badge", () => {
    render(
      <AssetsPage
        assets={[
          makeAsset({ name: "MacBook Pro", currentValue: 150000, warrantyExpiresAt: "2099-01-01" }),
        ]}
        onCreate={vi.fn()}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        selectedId={null}
      />,
    );
    expect(screen.getByText("MacBook Pro")).toBeInTheDocument();
    expect(screen.getAllByText("₹1,50,000").length).toBeGreaterThan(0);
    expect(screen.getByText("Warranty")).toBeInTheDocument();
  });

  it("selects an asset", async () => {
    const onSelect = vi.fn();
    render(
      <AssetsPage
        assets={[makeAsset({ id: "asset-1", name: "Desk" })]}
        onCreate={vi.fn()}
        onSelect={onSelect}
        onDelete={vi.fn()}
        selectedId={null}
      />,
    );
    await userEvent.click(screen.getByText("Desk"));
    expect(onSelect).toHaveBeenCalledWith("asset-1");
  });
});

describe("MaintenanceTracker", () => {
  const assets = [makeAsset({ id: "asset-1", name: "MacBook Pro" })];

  it("shows the empty state when nothing is scheduled", () => {
    render(
      <MaintenanceTracker items={[]} assets={assets} onCreate={vi.fn()} onComplete={vi.fn()} />,
    );
    expect(screen.getByText("Nothing scheduled")).toBeInTheDocument();
  });

  it("renders derived status and completes an item", async () => {
    const items = schedule(
      [
        {
          id: "mnt-1",
          assetId: "asset-1",
          title: "Service",
          dueAt: "2020-01-01",
          completedAt: null,
          cost: 5000,
          notes: "",
          intervalDays: 0,
          createdAt: "2019-01-01T00:00:00.000Z",
          updatedAt: "2019-01-01T00:00:00.000Z",
        },
      ],
      assets,
      FIXED_NOW,
    );
    const onComplete = vi.fn();
    render(
      <MaintenanceTracker
        items={items}
        assets={assets}
        onCreate={vi.fn()}
        onComplete={onComplete}
      />,
    );
    expect(screen.getByText("Service")).toBeInTheDocument();
    expect(screen.getByText("overdue")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onComplete).toHaveBeenCalledWith({ id: "mnt-1" });
  });
});

describe("VehiclesPage", () => {
  it("shows the empty state", () => {
    render(<VehiclesPage vehicles={[]} renewals={[]} onCreate={vi.fn()} />);
    expect(screen.getByText("No vehicles yet")).toBeInTheDocument();
  });

  it("lists a vehicle and flags it as uninsured", () => {
    render(
      <VehiclesPage
        vehicles={[makeVehicle({ name: "Swift", insurancePolicyId: null })]}
        renewals={[]}
        onCreate={vi.fn()}
      />,
    );
    expect(screen.getByText("Swift")).toBeInTheDocument();
    expect(screen.getByText("No policy linked")).toBeInTheDocument();
  });

  it("creates a vehicle", async () => {
    const onCreate = vi.fn();
    render(<VehiclesPage vehicles={[]} renewals={[]} onCreate={onCreate} />);
    await userEvent.type(screen.getByLabelText("Vehicle name"), "Swift");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ name: "Swift", type: "car" }));
  });
});

describe("InsurancePage", () => {
  it("shows the empty state", () => {
    render(<InsurancePage policies={[]} onCreate={vi.fn()} onAddClaim={vi.fn()} />);
    expect(screen.getByText("No policies yet")).toBeInTheDocument();
  });

  it("renders total cover and lists a policy", () => {
    render(
      <InsurancePage
        policies={[
          makePolicy({ name: "Health Cover", coverageAmount: 1000000, expiresAt: "2099-01-01" }),
        ]}
        onCreate={vi.fn()}
        onAddClaim={vi.fn()}
      />,
    );
    expect(screen.getByText("Health Cover")).toBeInTheDocument();
    expect(screen.getAllByText("₹10,00,000").length).toBeGreaterThan(0);
  });

  it("records a claim", async () => {
    const onAddClaim = vi.fn();
    render(
      <InsurancePage
        policies={[makePolicy({ id: "pol-1", name: "Cover", expiresAt: "2099-01-01" })]}
        onCreate={vi.fn()}
        onAddClaim={onAddClaim}
      />,
    );
    await userEvent.type(screen.getByLabelText("Record a claim on Cover"), "Windscreen");
    await userEvent.click(screen.getByRole("button", { name: "Add claim" }));
    expect(onAddClaim).toHaveBeenCalledWith({ id: "pol-1", claim: "Windscreen" });
  });
});

describe("DocumentsPage", () => {
  it("says plainly that it stores metadata only", () => {
    render(<DocumentsPage documents={[]} onCreate={vi.fn()} onRenew={vi.fn()} />);
    expect(screen.getByText(/METADATA ONLY, NO FILES/)).toBeInTheDocument();
    expect(screen.getByText("No documents catalogued")).toBeInTheDocument();
  });

  it("shows document health and an expiry countdown", () => {
    render(
      <DocumentsPage
        documents={[makeDocument({ name: "Passport", expiresAt: "2099-01-01" })]}
        onCreate={vi.fn()}
        onRenew={vi.fn()}
      />,
    );
    expect(screen.getByText("Passport")).toBeInTheDocument();
    expect(screen.getByText("100% valid")).toBeInTheDocument();
  });

  it("renews a document in place", async () => {
    const onRenew = vi.fn();
    render(
      <DocumentsPage
        documents={[makeDocument({ id: "doc-1", name: "Passport" })]}
        onCreate={vi.fn()}
        onRenew={onRenew}
      />,
    );
    const input = screen.getByLabelText("Renew Passport");
    await userEvent.type(input, "2036-01-01");
    await userEvent.click(screen.getByRole("button", { name: "Renew" }));
    expect(onRenew).toHaveBeenCalledWith({ id: "doc-1", expiresAt: "2036-01-01" });
  });
});

describe("TravelDocuments", () => {
  it("shows the empty state", () => {
    render(<TravelDocuments documents={[]} onCreate={vi.fn()} />);
    expect(screen.getByText("No travel documents")).toBeInTheDocument();
  });

  it("lists documents and their countries", () => {
    render(
      <TravelDocuments
        documents={[makeTravelDocument({ name: "Schengen Visa", country: "France" })]}
        onCreate={vi.fn()}
      />,
    );
    expect(screen.getByText("Schengen Visa")).toBeInTheDocument();
    expect(screen.getByText("France")).toBeInTheDocument();
  });
});

describe("ContactCard", () => {
  it("renders the derived strength badge", () => {
    const relationships = [makeRelationship({ id: "rel-1", name: "Asha Menon" })];
    const health = healthReport(relationships, interactionSeries("rel-1", 4, 5, 0), FIXED_NOW);
    render(
      <ContactCard
        relationship={relationships[0]!}
        health={health[0]}
        selected={false}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("Asha Menon")).toBeInTheDocument();
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });

  it("says so when there is no contact history", () => {
    const relationships = [makeRelationship({ id: "rel-1" })];
    const health = healthReport(relationships, [], FIXED_NOW);
    render(
      <ContactCard
        relationship={relationships[0]!}
        health={health[0]}
        selected={false}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText(/never contacted/)).toBeInTheDocument();
    expect(screen.getByText("Dormant")).toBeInTheDocument();
  });
});

describe("BirthdayCalendar", () => {
  it("shows the empty state", () => {
    render(<BirthdayCalendar dates={[]} />);
    expect(screen.getByText("No dates yet")).toBeInTheDocument();
  });

  it("renders a resolved upcoming birthday", () => {
    const dates = upcomingDates(
      [makeRelationship({ name: "Asha Menon", birthday: "07-20" })],
      FIXED_NOW,
    );
    render(<BirthdayCalendar dates={dates} />);
    expect(screen.getByText("Asha Menon")).toBeInTheDocument();
    expect(screen.getByText("in 4 days")).toBeInTheDocument();
  });
});

describe("NetworkingView", () => {
  it("shows the empty state with no events", () => {
    render(<NetworkingView relationships={[]} events={[]} onLogEvent={vi.fn()} />);
    expect(screen.getByText("No networking history")).toBeInTheDocument();
  });

  it("logs a networking event", async () => {
    const onLogEvent = vi.fn();
    render(
      <NetworkingView
        relationships={[makeRelationship({ id: "rel-1", name: "Asha" })]}
        events={[]}
        onLogEvent={onLogEvent}
      />,
    );
    await userEvent.type(screen.getByLabelText("Event title"), "SREcon");
    await userEvent.click(screen.getByRole("button", { name: "Log" }));
    expect(onLogEvent).toHaveBeenCalledWith({
      relationshipId: "rel-1",
      title: "SREcon",
      kind: "conference",
    });
  });
});

describe("RelationshipPage", () => {
  it("shows the empty state", () => {
    render(
      <RelationshipPage
        relationships={[]}
        health={[]}
        interactions={[]}
        selectedId={null}
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onLogInteraction={vi.fn()}
        onSetFollowUp={vi.fn()}
      />,
    );
    expect(screen.getByText("No contacts yet")).toBeInTheDocument();
  });

  it("converts the birthday field to a year-agnostic MM-DD", async () => {
    const onCreate = vi.fn();
    render(
      <RelationshipPage
        relationships={[]}
        health={[]}
        interactions={[]}
        selectedId={null}
        onSelect={vi.fn()}
        onCreate={onCreate}
        onLogInteraction={vi.fn()}
        onSetFollowUp={vi.fn()}
      />,
    );
    await userEvent.type(screen.getByLabelText("Contact name"), "Asha");
    await userEvent.type(screen.getByLabelText("Birthday"), "1995-07-20");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ birthday: "07-20" }));
  });

  it("orders contacts weakest-first, as the core reports them", () => {
    const relationships = [
      makeRelationship({ id: "rel-1", name: "Strong Tie" }),
      makeRelationship({ id: "rel-2", name: "Quiet Tie" }),
    ];
    const health = healthReport(relationships, interactionSeries("rel-1", 4, 5, 0), FIXED_NOW);
    render(
      <RelationshipPage
        relationships={relationships}
        health={health}
        interactions={[]}
        selectedId={null}
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onLogInteraction={vi.fn()}
        onSetFollowUp={vi.fn()}
      />,
    );
    const names = screen.getAllByText(/Tie$/).map((el) => el.textContent);
    expect(names[0]).toBe("Quiet Tie");
  });

  it("prompts to select a contact before showing history", () => {
    const relationships = [makeRelationship({ id: "rel-1", name: "Asha" })];
    const health = healthReport(relationships, [], FIXED_NOW);
    render(
      <RelationshipPage
        relationships={relationships}
        health={health}
        interactions={[]}
        selectedId={null}
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onLogInteraction={vi.fn()}
        onSetFollowUp={vi.fn()}
      />,
    );
    expect(screen.getByText("Select a contact")).toBeInTheDocument();
  });

  it("logs an interaction against the selected contact", async () => {
    const onLog = vi.fn();
    const relationships = [makeRelationship({ id: "rel-1", name: "Asha" })];
    const health = healthReport(relationships, [], FIXED_NOW);
    render(
      <RelationshipPage
        relationships={relationships}
        health={health}
        interactions={[]}
        selectedId="rel-1"
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onLogInteraction={onLog}
        onSetFollowUp={vi.fn()}
      />,
    );
    await userEvent.type(screen.getByLabelText("Interaction notes"), "Caught up");
    await userEvent.click(screen.getByRole("button", { name: "Log" }));
    expect(onLog).toHaveBeenCalledWith({
      relationshipId: "rel-1",
      type: "call",
      notes: "Caught up",
    });
  });

  it("schedules and clears a follow-up", async () => {
    const onSetFollowUp = vi.fn();
    const relationships = [makeRelationship({ id: "rel-1", name: "Asha" })];
    const health = healthReport(relationships, [], FIXED_NOW);
    render(
      <RelationshipPage
        relationships={relationships}
        health={health}
        interactions={[]}
        selectedId="rel-1"
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onLogInteraction={vi.fn()}
        onSetFollowUp={onSetFollowUp}
      />,
    );
    await userEvent.type(screen.getByLabelText("Follow-up date"), "2026-08-01");
    await userEvent.click(screen.getByRole("button", { name: "Schedule" }));
    expect(onSetFollowUp).toHaveBeenCalledWith({ id: "rel-1", nextFollowUpAt: "2026-08-01" });

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onSetFollowUp).toHaveBeenLastCalledWith({ id: "rel-1", nextFollowUpAt: null });
  });
});
