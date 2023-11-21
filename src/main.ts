import {
  typeormMigrationGenerator,
  typeormMigrationParser,
} from './typeorm-migrate';
import ora from 'ora';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';

const PWD = process.env.PWD;
export async function generalMigrateSql(
  migrateName: string,
  typeormConfigPath: string,
  migrationDir: string,
) {
  const spinner = ora({
    text: chalk.bgGreen.black('typeorn migrate is generating...\n'),
    color: 'green',
  }).start();
  const dir = path.resolve(PWD, migrationDir);
  const r = await typeormMigrationGenerator(
    migrateName,
    typeormConfigPath,
    migrationDir,
  );

  const parseRawUpSql = typeormMigrationParser(
    path.resolve(PWD, dir, `${r.migrateName}.ts`),
    'up',
  );
  const parseRawDownSql = typeormMigrationParser(
    path.resolve(PWD, dir, `${r.migrateName}.ts`),
    'down',
  );

  const sqlfileFullPath = path.resolve(PWD, `${migrationDir}/${r.migrateName}`);
  mkdirp.sync(sqlfileFullPath);

  fs.writeFileSync(path.resolve(`${sqlfileFullPath}/up.sql`), parseRawUpSql);
  fs.writeFileSync(
    path.resolve(`${sqlfileFullPath}/down.sql`),
    parseRawDownSql,
  );

  spinner.succeed(
    chalk.bgGreen.black(
      `typeorm migrate generation succeed : ${sqlfileFullPath}`,
    ),
  );
  // fs.appendFileSync(sqlfiles.up, ['', parseRawUpSql].join('\n'));
  // fs.appendFileSync(sqlfiles.down, ['', parseRawDownSql].join('\n'));
}
