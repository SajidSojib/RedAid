import { readFileSync } from "node:fs";
import { prisma } from "../lib/prisma";

type BaseLocation = {
  id: string | number;
  name: string;
  bn_name: string;
  url: string;
};

type DivisionData = BaseLocation;

type DistrictData = BaseLocation & {
  division_id?: string | number;
  divisionId?: string | number;
  lat: string | number;
  lon: string | number;
};

type UpazilaData = BaseLocation & {
  district_id?: string | number;
  districtId?: string | number;
};

type UnionData = BaseLocation & {
  upazilla_id?: string | number;
  upazila_id?: string | number;
  upazilaId?: string | number;
};

function readJson<T>(filename: string): T[] {
  return JSON.parse(
    readFileSync(new URL(`../../data/${filename}`, import.meta.url), "utf8"),
  ) as T[];
}

function requiredParentId(
  value: string | number | undefined,
  field: string,
): string {
  if (value === undefined || value === null || String(value) === "") {
    throw new Error(`Missing parent ID: ${field}`);
  }

  return String(value);
}

async function seedLocations() {
  try {
    const divisions = readJson<DivisionData>("division.json");
    const districts = readJson<DistrictData>("district.json");
    const upazilas = readJson<UpazilaData>("upazila.json");
    const unions = readJson<UnionData>("union.json");

    // 1. Seed divisions
    for (const item of divisions) {
      await prisma.division.upsert({
        where: { id: String(item.id) },
        update: {
          name: item.name,
          bn_name: item.bn_name,
          url: item.url,
        },
        create: {
          id: String(item.id),
          name: item.name,
          bn_name: item.bn_name,
          url: item.url,
        },
      });
    }

    console.log(`Seeded ${divisions.length} divisions`);

    // 2. Seed districts
    for (const item of districts) {
      const divisionId = requiredParentId(
        item.division_id ?? item.divisionId,
        `division for district ${item.id}`,
      );

      const latitude = Number(item.lat);
      const longitude = Number(item.lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error(`Invalid coordinates for district ${item.id}`);
      }

      await prisma.district.upsert({
        where: { id: String(item.id) },
        update: {
          name: item.name,
          bn_name: item.bn_name,
          url: item.url,
          latitude,
          longitude,
          divisionId,
        },
        create: {
          id: String(item.id),
          name: item.name,
          bn_name: item.bn_name,
          url: item.url,
          latitude,
          longitude,
          divisionId,
        },
      });
    }

    console.log(`Seeded ${districts.length} districts`);

    // 3. Seed upazilas
    for (const item of upazilas) {
      const districtId = requiredParentId(
        item.district_id ?? item.districtId,
        `district for upazila ${item.id}`,
      );

      await prisma.upazila.upsert({
        where: { id: String(item.id) },
        update: {
          name: item.name,
          bn_name: item.bn_name,
          url: item.url,
          districtId,
        },
        create: {
          id: String(item.id),
          name: item.name,
          bn_name: item.bn_name,
          url: item.url,
          districtId,
        },
      });
    }

    console.log(`Seeded ${upazilas.length} upazilas`);

    // 4. Seed unions
    for (const item of unions) {
      const upazilaId = requiredParentId(
        item.upazilla_id ?? item.upazila_id ?? item.upazilaId,
        `upazila for union ${item.id}`,
      );

      await prisma.union.upsert({
        where: { id: String(item.id) },
        update: {
          name: item.name,
          bn_name: item.bn_name,
          url: item.url,
          upazilaId,
        },
        create: {
          id: String(item.id),
          name: item.name,
          bn_name: item.bn_name,
          url: item.url,
          upazilaId,
        },
      });
    }

    console.log(`Seeded ${unions.length} unions`);
    console.log("Bangladesh location seeding completed!");
  } catch (error) {
    console.error("Location seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seedLocations();
