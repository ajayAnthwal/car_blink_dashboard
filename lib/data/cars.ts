export interface CarBrand {
  _id: string;
  name: string;
}

export interface CarModel {
  _id: string;
  brandId: string;
  name: string;
}

export const indianCarBrands: CarBrand[] = [
  { _id: "B_MARUTI", name: "Maruti Suzuki" },
  { _id: "B_HYUNDAI", name: "Hyundai" },
  { _id: "B_TATA", name: "Tata Motors" },
  { _id: "B_MAHINDRA", name: "Mahindra" },
  { _id: "B_KIA", name: "Kia" },
  { _id: "B_TOYOTA", name: "Toyota" },
  { _id: "B_HONDA", name: "Honda" },
  { _id: "B_MG", name: "MG Motors" },
  { _id: "B_SKODA", name: "Skoda" },
  { _id: "B_VW", name: "Volkswagen" },
  { _id: "B_RENAULT", name: "Renault" },
  { _id: "B_NISSAN", name: "Nissan" },
  { _id: "B_JEEP", name: "Jeep" },
  { _id: "B_FORD", name: "Ford" },
  { _id: "B_BMW", name: "BMW" },
  { _id: "B_MERCEDES", name: "Mercedes-Benz" },
  { _id: "B_AUDI", name: "Audi" },
  { _id: "B_VOLVO", name: "Volvo" },
  { _id: "B_JAGUAR", name: "Jaguar" },
  { _id: "B_LANDROVER", name: "Land Rover" },
  { _id: "B_PORSCHE", name: "Porsche" },
  { _id: "B_MINI", name: "MINI" },
  { _id: "B_LEXUS", name: "Lexus" },
  { _id: "B_FERRARI", name: "Ferrari" },
  { _id: "B_LAMBORGHINI", name: "Lamborghini" },
  { _id: "B_ASTONMARTIN", name: "Aston Martin" },
  { _id: "B_ROLLSROYCE", name: "Rolls-Royce" },
  { _id: "B_BENTLEY", name: "Bentley" },
  { _id: "B_MASERATI", name: "Maserati" },
  { _id: "B_CHEVROLET", name: "Chevrolet" },
  { _id: "B_FIAT", name: "Fiat" },
  { _id: "B_DATSUN", name: "Datsun" },
  { _id: "B_FORCE", name: "Force Motors" },
  { _id: "B_ISUZU", name: "Isuzu" },
  { _id: "B_BYD", name: "BYD" },
  { _id: "B_CITROEN", name: "Citroen" },
];

export const indianCarModels: CarModel[] = [
  // Maruti Suzuki
  { _id: "M_SWIFT", brandId: "B_MARUTI", name: "Swift" },
  { _id: "M_BALENO", brandId: "B_MARUTI", name: "Baleno" },
  { _id: "M_BREZZA", brandId: "B_MARUTI", name: "Brezza" },
  { _id: "M_WAGONR", brandId: "B_MARUTI", name: "Wagon R" },
  { _id: "M_DZIRE", brandId: "B_MARUTI", name: "Dzire" },
  { _id: "M_ERTIGA", brandId: "B_MARUTI", name: "Ertiga" },
  { _id: "M_FRONX", brandId: "B_MARUTI", name: "Fronx" },
  { _id: "M_GRANDVITARA", brandId: "B_MARUTI", name: "Grand Vitara" },
  { _id: "M_ALTO", brandId: "B_MARUTI", name: "Alto K10" },
  { _id: "M_CELERIO", brandId: "B_MARUTI", name: "Celerio" },
  { _id: "M_S_PRESSO", brandId: "B_MARUTI", name: "S-Presso" },
  { _id: "M_IGNIS", brandId: "B_MARUTI", name: "Ignis" },
  { _id: "M_XL6", brandId: "B_MARUTI", name: "XL6" },
  { _id: "M_CIAZ", brandId: "B_MARUTI", name: "Ciaz" },
  { _id: "M_JIMNY", brandId: "B_MARUTI", name: "Jimny" },
  { _id: "M_INVICTO", brandId: "B_MARUTI", name: "Invicto" },
  { _id: "M_EECO", brandId: "B_MARUTI", name: "Eeco" },

  // Hyundai
  { _id: "M_CRETA", brandId: "B_HYUNDAI", name: "Creta" },
  { _id: "M_VENUE", brandId: "B_HYUNDAI", name: "Venue" },
  { _id: "M_I20", brandId: "B_HYUNDAI", name: "i20" },
  { _id: "M_GRANDI10", brandId: "B_HYUNDAI", name: "Grand i10 Nios" },
  { _id: "M_VERNA", brandId: "B_HYUNDAI", name: "Verna" },
  { _id: "M_ALCAZAR", brandId: "B_HYUNDAI", name: "Alcazar" },
  { _id: "M_TUCSON", brandId: "B_HYUNDAI", name: "Tucson" },
  { _id: "M_EXTER", brandId: "B_HYUNDAI", name: "Exter" },
  { _id: "M_AURA", brandId: "B_HYUNDAI", name: "Aura" },
  { _id: "M_IONIQ5", brandId: "B_HYUNDAI", name: "Ioniq 5" },
  { _id: "M_SANTRO", brandId: "B_HYUNDAI", name: "Santro" },

  // Tata Motors
  { _id: "M_NEXON", brandId: "B_TATA", name: "Nexon" },
  { _id: "M_PUNCH", brandId: "B_TATA", name: "Punch" },
  { _id: "M_HARRIER", brandId: "B_TATA", name: "Harrier" },
  { _id: "M_SAFARI", brandId: "B_TATA", name: "Safari" },
  { _id: "M_ALTROZ", brandId: "B_TATA", name: "Altroz" },
  { _id: "M_TIAGO", brandId: "B_TATA", name: "Tiago" },
  { _id: "M_TIGOR", brandId: "B_TATA", name: "Tigor" },
  { _id: "M_HEXA", brandId: "B_TATA", name: "Hexa" },
  { _id: "M_TIAGO_EV", brandId: "B_TATA", name: "Tiago EV" },
  { _id: "M_NEXON_EV", brandId: "B_TATA", name: "Nexon EV" },
  { _id: "M_TIGOR_EV", brandId: "B_TATA", name: "Tigor EV" },
  { _id: "M_CURVV", brandId: "B_TATA", name: "Curvv" },

  // Mahindra
  { _id: "M_XUV700", brandId: "B_MAHINDRA", name: "XUV700" },
  { _id: "M_SCORPION", brandId: "B_MAHINDRA", name: "Scorpio-N" },
  { _id: "M_SCORPIOC", brandId: "B_MAHINDRA", name: "Scorpio Classic" },
  { _id: "M_THAR", brandId: "B_MAHINDRA", name: "Thar" },
  { _id: "M_XUV300", brandId: "B_MAHINDRA", name: "XUV300" },
  { _id: "M_XUV400", brandId: "B_MAHINDRA", name: "XUV400 EV" },
  { _id: "M_BOLERO", brandId: "B_MAHINDRA", name: "Bolero" },
  { _id: "M_BOLERO_NEO", brandId: "B_MAHINDRA", name: "Bolero Neo" },
  { _id: "M_MARAZZO", brandId: "B_MAHINDRA", name: "Marazzo" },

  // Kia
  { _id: "M_SELTOS", brandId: "B_KIA", name: "Seltos" },
  { _id: "M_SONET", brandId: "B_KIA", name: "Sonet" },
  { _id: "M_CARENS", brandId: "B_KIA", name: "Carens" },
  { _id: "M_EV6", brandId: "B_KIA", name: "EV6" },
  { _id: "M_CARNIVAL", brandId: "B_KIA", name: "Carnival" },

  // Toyota
  { _id: "M_INNOVA", brandId: "B_TOYOTA", name: "Innova Crysta" },
  { _id: "M_INNOVAHYCROSS", brandId: "B_TOYOTA", name: "Innova Hycross" },
  { _id: "M_FORTUNER", brandId: "B_TOYOTA", name: "Fortuner" },
  { _id: "M_GLANZA", brandId: "B_TOYOTA", name: "Glanza" },
  { _id: "M_URBANCRUISER", brandId: "B_TOYOTA", name: "Urban Cruiser Hyryder" },
  { _id: "M_HILUX", brandId: "B_TOYOTA", name: "Hilux" },
  { _id: "M_VELLFIRE", brandId: "B_TOYOTA", name: "Vellfire" },
  { _id: "M_CAMRY", brandId: "B_TOYOTA", name: "Camry" },
  { _id: "M_RUMION", brandId: "B_TOYOTA", name: "Rumion" },
  { _id: "M_TAISOR", brandId: "B_TOYOTA", name: "Taisor" },

  // Honda
  { _id: "M_CITY", brandId: "B_HONDA", name: "City" },
  { _id: "M_AMAZE", brandId: "B_HONDA", name: "Amaze" },
  { _id: "M_ELEVATE", brandId: "B_HONDA", name: "Elevate" },
  { _id: "M_CIVIC", brandId: "B_HONDA", name: "Civic" },
  { _id: "M_JAZZ", brandId: "B_HONDA", name: "Jazz" },
  { _id: "M_WRV", brandId: "B_HONDA", name: "WR-V" },

  // MG
  { _id: "M_HECTOR", brandId: "B_MG", name: "Hector" },
  { _id: "M_HECTOR_PLUS", brandId: "B_MG", name: "Hector Plus" },
  { _id: "M_ASTOR", brandId: "B_MG", name: "Astor" },
  { _id: "M_GLOSTER", brandId: "B_MG", name: "Gloster" },
  { _id: "M_COMET", brandId: "B_MG", name: "Comet EV" },
  { _id: "M_ZSEV", brandId: "B_MG", name: "ZS EV" },

  // Skoda
  { _id: "M_SLAVIA", brandId: "B_SKODA", name: "Slavia" },
  { _id: "M_KUSHAQ", brandId: "B_SKODA", name: "Kushaq" },
  { _id: "M_KODIAQ", brandId: "B_SKODA", name: "Kodiaq" },
  { _id: "M_SUPERB", brandId: "B_SKODA", name: "Superb" },
  { _id: "M_OCTAVIA", brandId: "B_SKODA", name: "Octavia" },

  // Volkswagen
  { _id: "M_VIRTUS", brandId: "B_VW", name: "Virtus" },
  { _id: "M_TAIGUN", brandId: "B_VW", name: "Taigun" },
  { _id: "M_TIGUAN", brandId: "B_VW", name: "Tiguan" },
  { _id: "M_POLO", brandId: "B_VW", name: "Polo" },
  { _id: "M_VENTO", brandId: "B_VW", name: "Vento" },
  { _id: "M_AMEO", brandId: "B_VW", name: "Ameo" },

  // Renault
  { _id: "M_KIGER", brandId: "B_RENAULT", name: "Kiger" },
  { _id: "M_TRIBER", brandId: "B_RENAULT", name: "Triber" },
  { _id: "M_KWID", brandId: "B_RENAULT", name: "Kwid" },
  { _id: "M_DUSTER", brandId: "B_RENAULT", name: "Duster" },

  // Nissan
  { _id: "M_MAGNITE", brandId: "B_NISSAN", name: "Magnite" },
  { _id: "M_KICKS", brandId: "B_NISSAN", name: "Kicks" },
  { _id: "M_MICRA", brandId: "B_NISSAN", name: "Micra" },
  { _id: "M_SUNNY", brandId: "B_NISSAN", name: "Sunny" },
  { _id: "M_TERRANO", brandId: "B_NISSAN", name: "Terrano" },
  
  // Jeep
  { _id: "M_COMPASS", brandId: "B_JEEP", name: "Compass" },
  { _id: "M_MERIDIAN", brandId: "B_JEEP", name: "Meridian" },
  { _id: "M_WRANGLER", brandId: "B_JEEP", name: "Wrangler" },
  { _id: "M_GRAND_CHEROKEE", brandId: "B_JEEP", name: "Grand Cherokee" },

  // Ford
  { _id: "M_ECOSPORT", brandId: "B_FORD", name: "EcoSport" },
  { _id: "M_ENDEAVOUR", brandId: "B_FORD", name: "Endeavour" },
  { _id: "M_FIGO", brandId: "B_FORD", name: "Figo" },
  { _id: "M_ASPIRE", brandId: "B_FORD", name: "Aspire" },
  { _id: "M_FREESTYLE", brandId: "B_FORD", name: "Freestyle" },
  { _id: "M_MUSTANG", brandId: "B_FORD", name: "Mustang" },

  // BMW
  { _id: "M_X1", brandId: "B_BMW", name: "X1" },
  { _id: "M_X3", brandId: "B_BMW", name: "X3" },
  { _id: "M_X5", brandId: "B_BMW", name: "X5" },
  { _id: "M_X7", brandId: "B_BMW", name: "X7" },
  { _id: "M_3_SERIES", brandId: "B_BMW", name: "3 Series" },
  { _id: "M_5_SERIES", brandId: "B_BMW", name: "5 Series" },
  { _id: "M_7_SERIES", brandId: "B_BMW", name: "7 Series" },
  { _id: "M_Z4", brandId: "B_BMW", name: "Z4" },
  { _id: "M_IX", brandId: "B_BMW", name: "iX" },
  { _id: "M_I4", brandId: "B_BMW", name: "i4" },

  // Mercedes-Benz
  { _id: "M_GLA", brandId: "B_MERCEDES", name: "GLA" },
  { _id: "M_GLC", brandId: "B_MERCEDES", name: "GLC" },
  { _id: "M_GLE", brandId: "B_MERCEDES", name: "GLE" },
  { _id: "M_GLS", brandId: "B_MERCEDES", name: "GLS" },
  { _id: "M_C_CLASS", brandId: "B_MERCEDES", name: "C-Class" },
  { _id: "M_E_CLASS", brandId: "B_MERCEDES", name: "E-Class" },
  { _id: "M_S_CLASS", brandId: "B_MERCEDES", name: "S-Class" },
  { _id: "M_EQC", brandId: "B_MERCEDES", name: "EQC" },
  { _id: "M_EQS", brandId: "B_MERCEDES", name: "EQS" },
  { _id: "M_G_CLASS", brandId: "B_MERCEDES", name: "G-Class" },

  // Audi
  { _id: "M_Q3", brandId: "B_AUDI", name: "Q3" },
  { _id: "M_Q5", brandId: "B_AUDI", name: "Q5" },
  { _id: "M_Q7", brandId: "B_AUDI", name: "Q7" },
  { _id: "M_Q8", brandId: "B_AUDI", name: "Q8" },
  { _id: "M_A4", brandId: "B_AUDI", name: "A4" },
  { _id: "M_A6", brandId: "B_AUDI", name: "A6" },
  { _id: "M_A8", brandId: "B_AUDI", name: "A8 L" },
  { _id: "M_E_TRON", brandId: "B_AUDI", name: "e-tron" },

  // Volvo
  { _id: "M_XC40", brandId: "B_VOLVO", name: "XC40" },
  { _id: "M_XC60", brandId: "B_VOLVO", name: "XC60" },
  { _id: "M_XC90", brandId: "B_VOLVO", name: "XC90" },
  { _id: "M_S90", brandId: "B_VOLVO", name: "S90" },
  { _id: "M_C40", brandId: "B_VOLVO", name: "C40 Recharge" },

  // Jaguar
  { _id: "M_F_PACE", brandId: "B_JAGUAR", name: "F-Pace" },
  { _id: "M_I_PACE", brandId: "B_JAGUAR", name: "I-Pace" },
  { _id: "M_XE", brandId: "B_JAGUAR", name: "XE" },
  { _id: "M_XF", brandId: "B_JAGUAR", name: "XF" },
  { _id: "M_F_TYPE", brandId: "B_JAGUAR", name: "F-Type" },

  // Land Rover
  { _id: "M_RANGE_ROVER", brandId: "B_LANDROVER", name: "Range Rover" },
  { _id: "M_DEFENDER", brandId: "B_LANDROVER", name: "Defender" },
  { _id: "M_DISCOVERY", brandId: "B_LANDROVER", name: "Discovery" },
  { _id: "M_DISCOVERY_SPORT", brandId: "B_LANDROVER", name: "Discovery Sport" },
  { _id: "M_EVOQUE", brandId: "B_LANDROVER", name: "Range Rover Evoque" },
  { _id: "M_VELAR", brandId: "B_LANDROVER", name: "Range Rover Velar" },

  // Porsche
  { _id: "M_MACAN", brandId: "B_PORSCHE", name: "Macan" },
  { _id: "M_CAYENNE", brandId: "B_PORSCHE", name: "Cayenne" },
  { _id: "M_PANAMERA", brandId: "B_PORSCHE", name: "Panamera" },
  { _id: "M_TAYCAN", brandId: "B_PORSCHE", name: "Taycan" },
  { _id: "M_911", brandId: "B_PORSCHE", name: "911" },

  // Citroen
  { _id: "M_C3", brandId: "B_CITROEN", name: "C3" },
  { _id: "M_E_C3", brandId: "B_CITROEN", name: "eC3" },
  { _id: "M_C3_AIRCROSS", brandId: "B_CITROEN", name: "C3 Aircross" },
  { _id: "M_C5_AIRCROSS", brandId: "B_CITROEN", name: "C5 Aircross" },

  // BYD
  { _id: "M_E6", brandId: "B_BYD", name: "e6" },
  { _id: "M_ATTO3", brandId: "B_BYD", name: "Atto 3" },
  { _id: "M_SEAL", brandId: "B_BYD", name: "Seal" },
];
