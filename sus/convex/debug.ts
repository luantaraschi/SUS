import { query } from "./_generated/server.js";

export const dumpState = query({
  args: {},
  handler: async (ctx) => {
    const rooms = await ctx.db.query("rooms").collect();
    const activeRooms = rooms.filter(r => r.status === "playing");
    
    const result = [];
    for (const room of activeRooms) {
      const players = await ctx.db.query("players").withIndex("by_room", q => q.eq("roomId", room._id)).collect();
      const round = await ctx.db.query("rounds").withIndex("by_room_number", q => q.eq("roomId", room._id).eq("number", room.currentRound)).first();
      
      result.push({
        roomCode: room.code,
        roomStatus: room.status,
        roundStatus: round?.status,
        players: players.map(p => ({
          name: p.name,
          isBot: p.isBot,
          status: p.status,
          role: p.role,
          hasSecret: !!p.secretContent
        }))
      });
    }
    return result;
  }
});
