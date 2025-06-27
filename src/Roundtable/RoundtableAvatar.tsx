import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface RoundtableAvatarProps {
  name: string;
  imageUrl?: string;
}

export function RoundtableAvatar({ name, imageUrl }: RoundtableAvatarProps) {
  const fallbackInitials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col items-center space-y-1">
      <Avatar className="h-12 w-12 border shadow-sm">
        {imageUrl ? (
          <AvatarImage src={imageUrl} alt={name} />
        ) : (
          <AvatarFallback>{fallbackInitials}</AvatarFallback>
        )}
      </Avatar>
      <span className="text-xs text-center font-medium text-muted-foreground truncate max-w-[70px]">
        {name}
      </span>
    </div>
  );
}