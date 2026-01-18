import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sparkles, LogIn, LogOut, CreditCard, Image } from "lucide-react";

export function Header() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 gap-4">
        <div className="flex items-center gap-6">
          <Link href="/app" className="flex items-center gap-2">
            <img 
              src="https://res.cloudinary.com/olilepage/image/upload/v1768745854/room-scene-update/logos/room-reimagine-logo-walnut-marble-black-background.jpg" 
              alt="RoomReimagine AI Logo" 
              className="h-7 w-auto rounded-sm"
              data-testid="img-app-logo"
            />
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/app">
              <Button 
                variant={location === "/app" ? "secondary" : "ghost"} 
                size="sm"
                data-testid="link-home"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Design
              </Button>
            </Link>
            <Link href="/gallery">
              <Button 
                variant={location === "/gallery" ? "secondary" : "ghost"} 
                size="sm"
                data-testid="link-gallery"
              >
                <Image className="h-4 w-4 mr-2" />
                Gallery
              </Button>
            </Link>
            <Link href="/pricing">
              <Button 
                variant={location === "/pricing" ? "secondary" : "ghost"} 
                size="sm"
                data-testid="link-pricing"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pricing
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="button-user-menu">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
                    <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none" data-testid="text-user-name">
                    {user.firstName} {user.lastName}
                  </p>
                  {user.email && (
                    <p className="text-xs leading-none text-muted-foreground" data-testid="text-user-email">
                      {user.email}
                    </p>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/pricing" className="w-full cursor-pointer" data-testid="dropdown-pricing">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing & Subscription</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/api/logout" className="w-full cursor-pointer" data-testid="button-logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" data-testid="button-login">
              <a href="/api/login">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
