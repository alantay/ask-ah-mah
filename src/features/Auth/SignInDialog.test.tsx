import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInDialog } from "./SignInDialog";

const mockSocial = jest.fn();
const mockMagicLink = jest.fn();

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      social: (...args: unknown[]) => mockSocial(...args),
      magicLink: (...args: unknown[]) => mockMagicLink(...args),
    },
  },
}));

async function openDialog() {
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
}

describe("SignInDialog", () => {
  beforeEach(() => {
    mockSocial.mockReset();
    mockMagicLink.mockReset();
    mockMagicLink.mockResolvedValue({ data: {}, error: null });
    mockSocial.mockResolvedValue({ data: {}, error: null });
  });

  it("shows both the Google button and the email field once opened", async () => {
    render(<SignInDialog />);
    await openDialog();

    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send me a link/i }),
    ).toBeInTheDocument();
  });

  it("keeps the submit disabled until the email looks valid", async () => {
    render(<SignInDialog />);
    await openDialog();

    const submit = screen.getByRole("button", { name: /send me a link/i });
    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/email/i), "not-an-email");
    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/email/i), "@example.com");
    expect(submit).toBeEnabled();
  });

  it("requests a magic link and swaps to the sent state on success", async () => {
    render(<SignInDialog />);
    await openDialog();

    await userEvent.type(screen.getByLabelText(/email/i), "cook@example.com");
    await userEvent.click(screen.getByRole("button", { name: /send me a link/i }));

    expect(mockMagicLink).toHaveBeenCalledWith({
      email: "cook@example.com",
      callbackURL: "/",
    });

    await waitFor(() =>
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument(),
    );
    expect(screen.getByText("cook@example.com")).toBeInTheDocument();
  });

  it("surfaces an inline error when sending fails", async () => {
    mockMagicLink.mockResolvedValue({ data: null, error: { message: "nope" } });
    render(<SignInDialog />);
    await openDialog();

    await userEvent.type(screen.getByLabelText(/email/i), "cook@example.com");
    await userEvent.click(screen.getByRole("button", { name: /send me a link/i }));

    await waitFor(() =>
      expect(screen.getByText(/couldn.t send the link/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/check your inbox/i)).not.toBeInTheDocument();
  });

  it("starts Google sign-in with the right provider and callback", async () => {
    render(<SignInDialog />);
    await openDialog();

    await userEvent.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );

    expect(mockSocial).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/",
    });
  });

  it("surfaces an inline error when Google sign-in fails", async () => {
    mockSocial.mockResolvedValue({ data: null, error: { message: "denied" } });
    render(<SignInDialog />);
    await openDialog();

    await userEvent.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );

    await waitFor(() =>
      expect(
        screen.getByText(/couldn.t sign in with google/i),
      ).toBeInTheDocument(),
    );
  });
});
