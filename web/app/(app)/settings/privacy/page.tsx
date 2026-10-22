import { AppHeader, PageTitle } from "@/components/ui";

// Figma Settings/privacy, with two changes: the design says "after 5 days", INV-001 says 7; and the
// "Delete my logbook" box is left out because account deletion isn't in the MVP (prd §10).
export default function PrivacyPage() {
  return (
    <>
      <AppHeader title="Privacy and data" backHref="/settings" />
      <main className="px-4 pb-12 pt-7">
        <PageTitle eyebrow="Designed to keep only what helps">Your order data</PageTitle>
        <div className="grid gap-6 font-body text-lg leading-[26px]">
          <section>
            <h3 className="font-display text-xl">What stays in your logbook</h3>
            <p>MabiList keeps the order details: customer name, items, quantity, price, delivery date, payment.</p>
          </section>
          <section>
            <h3 className="font-display text-xl">What gets removed</h3>
            <p>Screenshots and chats are deleted once you confirm or delete the entry, or after 7 days.</p>
          </section>
          <section>
            <h3 className="font-display text-xl">What MabiList does not keep</h3>
            <p>Phone numbers and addresses from chats aren’t saved.</p>
          </section>
          <p className="text-[13px] text-muted">This is how the app is designed to handle order data.</p>
        </div>
      </main>
    </>
  );
}
