// src/app/api/publish/route.ts
import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import { Database } from "@/types/index.t";

// Utility to escape reserved keywords
const escapeIdentifier = (name: string) => `[${name}]`;

export async function POST(req: NextRequest) {
  const { databases } = (await req.json()) as { databases: Database[] };

  console.log("Received databases:", JSON.stringify(databases, null, 2));

  try {
    const config = {
      user: "melese",
      password: "mele1234",
      server: "DESKTOP-EL2OM3V",
      database: "CRM",
      port: 1433,
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    };

    console.log(
      "Connecting to SQL Server with config:",
      JSON.stringify(config, null, 2)
    );
    const pool = await sql.connect(config);
    console.log("Connected to SQL Server");

    for (const db of databases) {
      console.log(`Processing database: ${db.name}`);
      await pool.request()
        .query(`IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${
        db.name
      }')
        CREATE DATABASE ${escapeIdentifier(db.name)}`);
      console.log(`Database ${db.name} created or already exists`);

      await pool.request().query(`USE ${escapeIdentifier(db.name)}`);
      console.log(`Switched to database: ${db.name}`);

      for (const table of db.tables) {
        if (table.attributes.length === 0) {
          console.log(`  Skipping table ${table.name} (no attributes)`);
          continue;
        }

        console.log(`  Creating table: ${table.name}`);
        console.log(`  Attributes:`, JSON.stringify(table.attributes, null, 2));

        const primaryKeyAttr =
          table.attributes.find(
            (attr) => attr.isPrimaryKey && attr.autoIncrement
          ) ||
          table.attributes.find((attr) => attr.isPrimaryKey) ||
          null;
        let columns = table.attributes
          .map((attr) => {
            let type =
              attr.type === "VARCHAR" || attr.type === "NVARCHAR"
                ? `${attr.type}(${attr.length || 255})`
                : attr.type;
            let constraints = [];
            if (attr === primaryKeyAttr) {
              constraints.push(
                attr.autoIncrement ? "IDENTITY(1,1) PRIMARY KEY" : "PRIMARY KEY"
              );
            }
            if (attr.isRequired && attr !== primaryKeyAttr)
              constraints.push("NOT NULL");
            if (attr.defaultValue)
              constraints.push(`DEFAULT '${attr.defaultValue}'`);
            return `${escapeIdentifier(attr.name)} ${type} ${constraints.join(
              " "
            )}`;
          })
          .join(", ");

        const createTableSql = `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '${
          table.name
        }')
          CREATE TABLE ${escapeIdentifier(table.name)} (${columns})`;
        console.log(`  SQL: ${createTableSql}`);
        await pool.request().query(createTableSql);
        console.log(`  Table ${table.name} created`);
      }

      for (const table of db.tables) {
        if (table.attributes.length === 0) continue;
        for (const attr of table.attributes) {
          if (attr.foreignKey) {
            const fkConstraint = `FK_${table.name}_${attr.name}_${attr.foreignKey.table}`;
            const fkSql = `
              ALTER TABLE ${escapeIdentifier(table.name)}
              ADD CONSTRAINT ${escapeIdentifier(fkConstraint)}
              FOREIGN KEY (${escapeIdentifier(attr.name)})
              REFERENCES ${escapeIdentifier(
                attr.foreignKey.table
              )} (${escapeIdentifier(attr.foreignKey.column)})
            `;
            console.log(`  Adding foreign key: ${fkConstraint}`);
            console.log(`  SQL: ${fkSql}`);
            await pool.request().query(fkSql);
            console.log(`  Foreign key ${fkConstraint} added`);
          }
        }
      }

      console.log(`Final structure for ${db.name}:`);
      db.tables.forEach((table) => {
        console.log(
          `  => ${table.name} (its attributes: ${JSON.stringify(
            table.attributes,
            null,
            2
          )})`
        );
      });
    }

    await pool.close();
    console.log("SQL Server connection closed");
    return NextResponse.json(
      { message: "Published successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in publishing:", error);
    return NextResponse.json(
      { message: (error as Error).message },
      { status: 500 }
    );
  }
}
