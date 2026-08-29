"use client";

import { useState, useCallback } from "react";
import { PlaceLink } from "@/components/place/place-link";

type Tab = "attractions" | "hidden-gems" | "heritage" | "events" | "experiences";

interface TabPanelProps {
  destinationName: string;
  attractions: Array<{ name: string; description: string; category: string; tip: string }>;
  hiddenGems: Array<{ name: string; description: string; whyVisit: string; localTip: string }>;
  heritage: {
    highlights: string[];
    traditions: string[];
    etiquetteTips: string[];
    culturalSignificance: string;
  };
  events: Array<{ name: string; date: string; description: string; location: string }>;
  experiences: Array<{
    name: string;
    description: string;
    type: string;
    duration: string;
    authenticityNote: string;
  }>;
}

const tabs: { id: Tab; label: string }[] = [
  { id: "attractions", label: "Attractions" },
  { id: "hidden-gems", label: "Hidden Gems" },
  { id: "heritage", label: "Heritage" },
  { id: "events", label: "Events" },
  { id: "experiences", label: "Experiences" },
];

export function DestinationTabs({
  destinationName,
  attractions,
  hiddenGems,
  heritage,
  events,
  experiences,
}: TabPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("attractions");

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      let next = index;
      if (e.key === "ArrowRight") {
        next = (index + 1) % tabs.length;
      } else if (e.key === "ArrowLeft") {
        next = (index - 1 + tabs.length) % tabs.length;
      } else {
        return;
      }
      e.preventDefault();
      setActiveTab(tabs[next].id);
      document.getElementById(`dest-tab-${tabs[next].id}`)?.focus();
    },
    [],
  );

  return (
    <div>
      <div className="theme-divider mb-6 flex flex-wrap gap-2 border-b pb-4" role="tablist" aria-label="Destination details">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`dest-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`dest-panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => handleTabKeyDown(e, index)}
            className={`theme-tab rounded-lg px-4 py-2 text-sm ${
              activeTab === tab.id ? "theme-tab-active font-semibold" : ""
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`dest-panel-${activeTab}`} aria-labelledby={`dest-tab-${activeTab}`}>
        {activeTab === "attractions" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {attractions.map((item) => (
              <div key={item.name} className="theme-card">
                <span className="theme-badge text-[10px]">{item.category}</span>
                <h4 className="theme-text mt-1 font-semibold">
                  <PlaceLink name={item.name} destinationContext={destinationName} className="font-semibold" />
                </h4>
                <p className="theme-text-muted mt-2 text-sm">{item.description}</p>
                <p className="theme-text-subtle mt-2 text-xs">Tip: {item.tip}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "hidden-gems" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {hiddenGems.map((item) => (
              <div key={item.name} className="theme-card">
                <h4 className="theme-text font-semibold">
                  <PlaceLink name={item.name} destinationContext={destinationName} className="font-semibold" />
                </h4>
                <p className="theme-text-muted mt-2 text-sm">{item.description}</p>
                <p className="theme-text mt-2 text-sm font-medium">{item.whyVisit}</p>
                <p className="theme-text-subtle mt-2 text-xs">Local tip: {item.localTip}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "heritage" && (
          <div className="space-y-6">
            <div className="theme-card">
              <h4 className="theme-text font-semibold">Cultural Significance</h4>
              <p className="theme-text-muted mt-2 text-sm">{heritage.culturalSignificance}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { title: "Highlights", items: heritage.highlights },
                { title: "Traditions", items: heritage.traditions },
                { title: "Etiquette Tips", items: heritage.etiquetteTips },
              ].map((section) => (
                <div key={section.title} className="theme-card">
                  <h4 className="theme-text font-semibold">{section.title}</h4>
                  <ul className="theme-text-muted mt-2 list-inside list-disc space-y-1 text-sm">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "events" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {events.map((item) => (
              <div key={item.name} className="theme-card">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="theme-text font-semibold">
                    <PlaceLink
                      name={item.name}
                      destinationContext={destinationName}
                      className="font-semibold"
                    />
                  </h4>
                  <span className="theme-badge text-[10px]">{item.date}</span>
                </div>
                <p className="theme-text-muted mt-2 text-sm">{item.description}</p>
                <p className="theme-text-subtle mt-2 text-xs">
                  <PlaceLink name={item.location} destinationContext={destinationName} />
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "experiences" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {experiences.map((item) => (
              <div key={item.name} className="theme-card">
                <div className="flex items-center gap-2">
                  <span className="theme-badge text-[10px]">{item.type}</span>
                  <span className="theme-text-subtle text-xs">{item.duration}</span>
                </div>
                <h4 className="theme-text mt-2 font-semibold">
                  <PlaceLink name={item.name} destinationContext={destinationName} className="font-semibold" />
                </h4>
                <p className="theme-text-muted mt-2 text-sm">{item.description}</p>
                <p className="theme-text-subtle mt-2 text-xs italic">{item.authenticityNote}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="theme-text-subtle mt-6 text-center text-xs">
        Cultural insights for {destinationName} powered by Gemini AI
      </p>
    </div>
  );
}
