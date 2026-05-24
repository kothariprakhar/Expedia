// Hardcoded current user for the prototype.
// In a real Expedia flow this would come from the auth session.
// Itineraries are keyed by userId so the "users can only add to their own
// itinerary" rule is enforced by the mock API rejecting writes for any other userId.
export const CURRENT_USER = {
  userId: 'u_nora',
  name: 'Nora',
  initials: 'N',
  tier: 'Blue tier',
  oneKeyCash: '$15.00',
  email: 'nora@example.com'
}
