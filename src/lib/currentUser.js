// Hardcoded current user for the MVE.
// In a real Expedia flow this would come from the auth session.
// Itineraries are keyed by userId so the "users can only add to their own itinerary"
// rule is enforced by the mock API rejecting writes for any other userId.
export const CURRENT_USER = {
  userId: 'u_demo_traveler',
  name: 'Adesh',
  email: 'ad13dhanoa@gmail.com'
}
