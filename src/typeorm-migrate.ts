import { exec } from 'child_process';

import { Project, StringLiteral, NoSubstitutionTemplateLiteral } from 'ts-morph';

export interface MigrationEnv {
  [key: string]: any;
}
const PWD = process.env.PWD;
//TODO  env

export interface TypeOrmMigrationResult {
  migrateName: string; //生成的typeorm sql
}

const sqlHeader = ['SET AUTOCOMMIT=0;', 'START TRANSACTION;'];
const sqlFooter = ['COMMIT;'];
export function typeormMigrationGenerator(
  migrateName: string,
  configPath: string,
  migrationDir: string,
): Promise<TypeOrmMigrationResult> {
  return new Promise((resolve) => {
    exec(
      `ts-node ./node_modules/typeorm/cli migration:generate -d ${configPath} ${migrationDir}/${migrateName}`,
      {
        cwd: PWD,
      },
      async (err, stdout, stderr) => {
        if (err) {
          console.error(err);
        } else {
          // console.log(`${path.resolve(PWD, configPath)}`);
          // const ORMConfig = await import(`${path.resolve(PWD, configPath)}`);
          // console.log(ORMConfig);
        
          resolve({
            migrateName: stdout
              .match(/[\d]{13}-(\w.*)\.ts/gim)[0]
              .replace(/\.ts/, ''),
          });
        }
      },
    );
  });
}

export function typeormMigrationParser(filePath: string, methodName: string) {
  const project = new Project();
  project.addSourceFilesAtPaths(filePath);

  const sourceFile = project.getSourceFileOrThrow(filePath);

  const temp = [];
  sourceFile
    .getClasses()[0]
    .getMethod(methodName)
    .getBody()
    .forEachDescendantAsArray()
    .forEach((item) => {
      if (item instanceof StringLiteral || item instanceof NoSubstitutionTemplateLiteral) {
        const sqlRaw = unescapeSqlString(item.getFullText().replace(/\"/gim, ''));
        temp.push(`${sqlRaw};`);
      }
    });

  const fullContent = [].concat(sqlHeader, temp, sqlFooter);
  return fullContent.join('\n');
}

function unescapeSqlString(sqlString: string) {
  // Replace double backticks with single backticks
  sqlString = sqlString.replace(/\\`/g, '`');

  // Replace escaped single quotes with single quotes
  sqlString = sqlString.replace(/\\'/g, "'");

  sqlString = sqlString.substring(1);
  sqlString = sqlString.substring(0, sqlString.length - 1);
  return sqlString;
}

