import PriceBoard from "@/components/price-board"
import { getDayPrices, getPromotions } from "@/lib/db"

export default async function BoardPage() {
  const prices = await getDayPrices()
  const promotions = await getPromotions()

  return (
    <div className="w-[1920px] h-[1080px]">
      <PriceBoard prices={prices} promotions={promotions} fullscreen={true} />
    </div>
  )
}
