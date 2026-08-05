import type { TravelBrief } from "@/types/brief";
import type { DestinationKnowledge } from "@/types/destination";
import type { ItineraryDay } from "@/types/recommendation";

function dayPaceFor(briefPace: TravelBrief["pace"], dayIndex: number, totalDays: number): ItineraryDay["pace"] {
  if (briefPace === "relaxed") return dayIndex % 3 === 2 ? "balanced" : "light";
  if (briefPace === "active") return dayIndex % 4 === 3 ? "balanced" : "active";
  // balanced default: alternate with light days sprinkled in
  if (dayIndex === 0 || dayIndex === totalDays - 1) return "light";
  return dayIndex % 3 === 0 ? "light" : "balanced";
}

/**
 * Deterministic, KTIE-grounded itinerary draft.
 * Never claims reservations or availability — it is a starting plan for a
 * Klar expert to refine.
 */
export function composeItinerary(
  destination: DestinationKnowledge,
  brief: TravelBrief,
): ItineraryDay[] {
  const requested = brief.durationNights ?? destination.idealNights;
  const nights = Math.max(
    destination.minimumNights,
    Math.min(destination.maximumNights, requested),
  );
  const days = nights + 1;

  const hasYoungChildren = brief.childrenAges.some((a) => a <= 10);
  const hasSeniors = brief.seniorTravellers > 0 || brief.travellerType === "senior";
  const hasAccessibilityNeeds = brief.accessibilityNeeds.length > 0;

  const experiences = [...destination.signatureExperiences];
  const gems = [...destination.hiddenGems];

  const itinerary: ItineraryDay[] = [];

  for (let i = 0; i < days; i++) {
    const dayNumber = i + 1;
    const pace = dayPaceFor(brief.pace, i, days);
    const notes: string[] = [];
    const activities: ItineraryDay["activities"] = [];

    if (i === 0) {
      activities.push({
        title: `Arrive in ${destination.name}`,
        description:
          "Airport transfer, check-in and time to settle. Your Klar expert will confirm flight timings and transfer details.",
      });
      activities.push({
        title: "Gentle first evening",
        description: "A short walk or relaxed dinner near your stay to shake off the journey.",
        optional: true,
      });
      notes.push("Kept light on purpose after the flight.");
      if (hasYoungChildren) notes.push("Early dinner suggested for children after travel.");
    } else if (i === days - 1) {
      activities.push({
        title: "Departure day",
        description:
          "Free morning for last strolls or shopping, then checkout and airport transfer. Your Klar expert will time this around your flight.",
      });
      notes.push("Checkout and transfer timing to be confirmed by your consultant.");
    } else {
      const isRestDay = pace === "light" && i > 1 && i < days - 2 && (brief.pace !== "active");
      const main = experiences.shift();
      if (main && !isRestDay) {
        activities.push({
          title: main,
          description: `A signature ${destination.name} experience, planned at a ${pace} pace.`,
        });
        const gem = i % 2 === 0 ? gems.shift() : undefined;
        if (gem) {
          activities.push({
            title: gem,
            description: "A quieter local favourite if you have the energy.",
            optional: true,
          });
        }
      } else {
        activities.push({
          title: "Rest and flexibility day",
          description:
            "Pool, spa, beach or unhurried wandering — space to enjoy the destination without a schedule.",
        });
        const gem = gems.shift();
        if (gem) {
          activities.push({
            title: gem,
            description: "An easy optional outing nearby.",
            optional: true,
          });
        }
      }
      if (hasYoungChildren && pace !== "light") {
        notes.push("Built-in downtime after lunch works well with children.");
      }
      if (hasSeniors) {
        notes.push("Transport between stops rather than long walks where possible.");
      }
    }

    if (hasAccessibilityNeeds && i === 1) {
      notes.push(
        "Accessibility requirements noted — your Klar expert will confirm step-free options for each activity.",
      );
    }

    itinerary.push({
      day: dayNumber,
      title:
        i === 0
          ? `Welcome to ${destination.name}`
          : i === days - 1
            ? "Until next time"
            : activities[0].title,
      pace,
      activities,
      notes,
    });
  }

  return itinerary;
}
