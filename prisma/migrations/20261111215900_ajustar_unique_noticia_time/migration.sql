-- Drop the global URL uniqueness and scope it to each team.
DROP INDEX "NoticiaTime_url_key";

CREATE UNIQUE INDEX "NoticiaTime_timeId_url_key"
ON "NoticiaTime"("timeId", "url");
