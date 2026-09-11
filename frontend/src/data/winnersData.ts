export type WinnerData = {
  name: string;
  entry_no: string;
  cash: number;
  id: string;
  announced_on: Date;
  image: string;
};

const winnersData: WinnerData[] = [
  {
    name: "Georgii Soroka",
    entry_no: "DC-11000-247629612",
    cash: 20375,
    id: "DC-01078",
    announced_on: new Date("2026-09-09"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw7ce2676d/images/campaignSliderImage/DC-01078-dashboard-image-2.png",
  },
  {
    name: "Shiva Bhandari",
    entry_no: "DC-11184-247657103",
    cash: 15750,
    id: "DC-01133",
    announced_on: new Date("2026-09-06"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw8037f828/images/campaignSliderImage/DC-01105-dashboard-image.png",
  },
  {
    name: "Alagan Manivannan",
    entry_no: "DC-11311-247684594",
    cash: 11125,
    id: "DC-01128",
    announced_on: new Date("2026-09-04"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw888f85b6/images/campaignSliderImage/DC-01119-dashboard-image.png",
  },
  {
    name: "Rodolfo Mena",
    entry_no: "DC-11495-247712085",
    cash: 6500,
    id: "DC-01131",
    announced_on: new Date("2026-09-02"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw19a67e88/images/campaignSliderImage/DC-00992-dashboard-image.jpg",
  },
  {
    name: "Aisha Rahman",
    entry_no: "DC-11622-247739576",
    cash: 31875,
    id: "DC-00961",
    announced_on: new Date("2026-09-08"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dwa5f92efc/images/campaignSliderImage/DC-00961-dashboard-image8.png",
  },
  {
    name: "Khalid Nasser",
    entry_no: "DC-11806-247767067",
    cash: 47250,
    id: "DA-00061",
    announced_on: new Date("2026-09-05"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw231fd485/images/campaignSliderImage/DA-00061-dashboard-image6.jpg",
  },
  {
    name: "Lina Hassan",
    entry_no: "DC-11933-247794558",
    cash: 27625,
    id: "DC-01113",
    announced_on: new Date("2026-09-03"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw67c0ee1f/images/campaignSliderImage/DC-00986-dashboard-image.jpg",
  },
  {
    name: "Omar Haddad",
    entry_no: "DC-12117-247822049",
    cash: 123000,
    id: "DE-00456",
    announced_on: new Date("2026-09-01"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dwb7331206/images/campaignSliderImage/DE-00456-dashboard-image.jpg",
  },
  {
    name: "Sara Al-Mansoori",
    entry_no: "DC-12244-247849540",
    cash: 23375,
    id: "DC-01079",
    announced_on: new Date("2026-08-30"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw7ce2676d/images/campaignSliderImage/DC-01078-dashboard-image-2.png",
  },
  {
    name: "Noah Carter",
    entry_no: "DC-12428-247877031",
    cash: 18750,
    id: "DC-01134",
    announced_on: new Date("2026-08-28"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw8037f828/images/campaignSliderImage/DC-01105-dashboard-image.png",
  },
  {
    name: "Georgii Soroka",
    entry_no: "DC-12555-247904522",
    cash: 14125,
    id: "DC-01129",
    announced_on: new Date("2026-08-26"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw888f85b6/images/campaignSliderImage/DC-01119-dashboard-image.png",
  },
  {
    name: "Shiva Bhandari",
    entry_no: "DC-12739-247932013",
    cash: 9500,
    id: "DC-01132",
    announced_on: new Date("2026-08-24"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw19a67e88/images/campaignSliderImage/DC-00992-dashboard-image.jpg",
  },
  {
    name: "Alagan Manivannan",
    entry_no: "DC-12866-247959504",
    cash: 34875,
    id: "DC-00962",
    announced_on: new Date("2026-08-22"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dwa5f92efc/images/campaignSliderImage/DC-00961-dashboard-image8.png",
  },
  {
    name: "Rodolfo Mena",
    entry_no: "DC-13050-247986995",
    cash: 50250,
    id: "DA-00062",
    announced_on: new Date("2026-08-20"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw231fd485/images/campaignSliderImage/DA-00061-dashboard-image6.jpg",
  },
  {
    name: "Aisha Rahman",
    entry_no: "DC-13177-248014486",
    cash: 30625,
    id: "DC-01114",
    announced_on: new Date("2026-08-18"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw67c0ee1f/images/campaignSliderImage/DC-00986-dashboard-image.jpg",
  },
  {
    name: "Khalid Nasser",
    entry_no: "DC-13361-248041977",
    cash: 126000,
    id: "DE-00457",
    announced_on: new Date("2026-08-16"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dwb7331206/images/campaignSliderImage/DE-00456-dashboard-image.jpg",
  },
  {
    name: "Lina Hassan",
    entry_no: "DC-13488-248069468",
    cash: 25375,
    id: "DC-01080",
    announced_on: new Date("2026-08-14"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw7ce2676d/images/campaignSliderImage/DC-01078-dashboard-image-2.png",
  },
  {
    name: "Omar Haddad",
    entry_no: "DC-13672-248096959",
    cash: 20750,
    id: "DC-01135",
    announced_on: new Date("2026-08-12"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw8037f828/images/campaignSliderImage/DC-01105-dashboard-image.png",
  },
  {
    name: "Sara Al-Mansoori",
    entry_no: "DC-13799-248124450",
    cash: 16125,
    id: "DC-01130",
    announced_on: new Date("2026-08-10"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw888f85b6/images/campaignSliderImage/DC-01119-dashboard-image.png",
  },
  {
    name: "Noah Carter",
    entry_no: "DC-13983-248151941",
    cash: 11500,
    id: "DC-01133",
    announced_on: new Date("2026-08-08"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw19a67e88/images/campaignSliderImage/DC-00992-dashboard-image.jpg",
  },
  {
    name: "Georgii Soroka",
    entry_no: "DC-14110-248179432",
    cash: 37875,
    id: "DC-00963",
    announced_on: new Date("2026-08-06"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dwa5f92efc/images/campaignSliderImage/DC-00961-dashboard-image8.png",
  },
  {
    name: "Shiva Bhandari",
    entry_no: "DC-14294-248206923",
    cash: 53250,
    id: "DA-00063",
    announced_on: new Date("2026-08-04"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw231fd485/images/campaignSliderImage/DA-00061-dashboard-image6.jpg",
  },
  {
    name: "Alagan Manivannan",
    entry_no: "DC-14421-248234414",
    cash: 33625,
    id: "DC-01115",
    announced_on: new Date("2026-08-02"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw67c0ee1f/images/campaignSliderImage/DC-00986-dashboard-image.jpg",
  },
  {
    name: "Rodolfo Mena",
    entry_no: "DC-14605-248261905",
    cash: 129000,
    id: "DE-00458",
    announced_on: new Date("2026-07-31"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dwb7331206/images/campaignSliderImage/DE-00456-dashboard-image.jpg",
  },
  {
    name: "Aisha Rahman",
    entry_no: "DC-14732-248289396",
    cash: 27375,
    id: "DC-01081",
    announced_on: new Date("2026-07-29"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw7ce2676d/images/campaignSliderImage/DC-01078-dashboard-image-2.png",
  },
  {
    name: "Khalid Nasser",
    entry_no: "DC-14916-248316887",
    cash: 22750,
    id: "DC-01136",
    announced_on: new Date("2026-07-27"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw8037f828/images/campaignSliderImage/DC-01105-dashboard-image.png",
  },
  {
    name: "Lina Hassan",
    entry_no: "DC-15043-248344378",
    cash: 18125,
    id: "DC-01137",
    announced_on: new Date("2026-07-25"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw888f85b6/images/campaignSliderImage/DC-01119-dashboard-image.png",
  },
  {
    name: "Omar Haddad",
    entry_no: "DC-15227-248371869",
    cash: 13500,
    id: "DC-00993",
    announced_on: new Date("2026-07-23"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw19a67e88/images/campaignSliderImage/DC-00992-dashboard-image.jpg",
  },
  {
    name: "Sara Al-Mansoori",
    entry_no: "DC-15354-248399360",
    cash: 40875,
    id: "DC-00964",
    announced_on: new Date("2026-07-21"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dwa5f92efc/images/campaignSliderImage/DC-00961-dashboard-image8.png",
  },
  {
    name: "Noah Carter",
    entry_no: "DC-15538-248426851",
    cash: 56250,
    id: "DA-00064",
    announced_on: new Date("2026-07-19"),
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw231fd485/images/campaignSliderImage/DA-00061-dashboard-image6.jpg",
  },
];

export default winnersData;
