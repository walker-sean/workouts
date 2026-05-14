import { describe, expect, it, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import App from "../../app"
import { db, seedIfEmpty } from "../../data/db"

beforeEach(async () => {
  await db.delete()
  await db.open()
  await seedIfEmpty()
  // Skip the first-run setup screen by marking it done
  await db.settings.update("singleton", { firstRunDone: true })
})

function renderApp() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <App />
    </QueryClientProvider>
  )
}

describe("workout flow", () => {
  it("starts a workout, logs a set, and finishes", async () => {
    renderApp()

    await screen.findByRole("button", { name: /start workout/i })
    fireEvent.click(screen.getByRole("button", { name: /start workout/i }))

    // The workout view appears with a Warmup card and exercise cards
    await screen.findAllByText(/warmup/i)

    // Expand the first exercise (its name comes from the seeded plan — Smith Machine Bench Press)
    fireEvent.click(screen.getByText(/smith machine bench press/i))

    // Log the first set (use the first visible "Log" button)
    const logButtons = await screen.findAllByRole("button", { name: /^log$/i })
    fireEvent.click(logButtons[0])

    // The Log button for that set should disappear
    await waitFor(() => {
      const remaining = screen.queryAllByRole("button", { name: /^log$/i })
      expect(remaining.length).toBeLessThan(logButtons.length)
    })

    // Finish the workout
    fireEvent.click(screen.getByRole("button", { name: /finish workout/i }))

    // Summary screen
    await screen.findByText(/workout complete/i)
  })
})
