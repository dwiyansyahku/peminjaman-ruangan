"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Megaphone,
    Building2,
    ArrowRight,
    Calendar,
} from "lucide-react";
import type { Announcement, Room } from "@/db/schema";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface AnnouncementCardProps {
    announcement: Announcement;
    linkedRoom?: Room | null;
    onBookRoom?: (roomId: number) => void;
    isAdmin?: boolean;
    onEdit?: (announcement: Announcement) => void;
    disabled?: boolean;
}

export function AnnouncementCard({
    announcement,
    linkedRoom,
    onBookRoom,
    isAdmin = false,
    onEdit,
    disabled = false,
}: AnnouncementCardProps) {
    return (
        <Card className={`group overflow-hidden border-none rounded-2xl bg-white shadow-sm shadow-slate-200/50 transition-all duration-300 ${disabled ? 'opacity-50 pointer-events-none' : 'hover:shadow-lg hover:shadow-blue-500/5'}`}>
            <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                        <Megaphone className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-800 truncate">
                                {announcement.title}
                            </h3>
                            {!announcement.isActive && (
                                <Badge variant="secondary" className="text-xs">
                                    Nonaktif
                                </Badge>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-slate-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(announcement.createdAt), "dd MMMM yyyy", {
                                locale: id,
                            })}
                        </p>
                    </div>
                </div>

                {/* Description */}
                {announcement.description && (
                    <p className="mt-3 text-sm text-slate-600 line-clamp-2">
                        {announcement.description}
                    </p>
                )}

                {/* Linked Room */}
                {linkedRoom && (
                    <div className="mt-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-3">
                        <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-slate-700">
                                {linkedRoom.name}
                            </span>
                            <Badge variant="outline" className="ml-auto text-xs">
                                Kapasitas: {linkedRoom.capacity}
                            </Badge>
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="border-t bg-slate-50/50 px-5 py-3">
                <div className="flex w-full items-center justify-between">
                    {linkedRoom && !isAdmin && (
                        <Button
                            onClick={() => onBookRoom?.(linkedRoom.id)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 rounded-xl font-semibold transition-all hover:-translate-y-0.5"
                        >
                            Pinjam Sekarang
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                    {isAdmin && (
                        <Button
                            onClick={() => onEdit?.(announcement)}
                            variant="outline"
                            size="sm"
                            className="rounded-xl font-medium border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                            Edit
                        </Button>
                    )}
                    {!linkedRoom && !isAdmin && (
                        <span className="text-xs text-slate-400">
                            Pengumuman informasi
                        </span>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}
