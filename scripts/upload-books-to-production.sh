#!/bin/bash
# Upload all textbook PDFs to the production RAG endpoint
# Usage: bash scripts/upload-books-to-production.sh

API_URL="http://opschool.tie.go.tz:5002"
API_KEY="d53e956e0792841048a1cb215ea7d83dd01812aea990c0bcd8471b3fb52cb5e4"
DOWNLOADS="$HOME/Downloads"

# Form 1 classLevel ID / Form 2 classLevel ID
FORM1="66571e097b076d51f6fb9fc5"
FORM2="6658663a7b076d51f6fc038b"

# Subject IDs
BIOLOGY="6658658d7b076d51f6fc0381"
CHEMISTRY="665865867b076d51f6fc037f"
PHYSICS="665865487b076d51f6fc037a"
MATHEMATICS="67f50a3fb88b1b7c13b40b40"
GEOGRAPHY="665865967b076d51f6fc0383"
COMPUTER_SCIENCE="696ce51b562c1b378103e856"
ENGLISH="696a4063cae7037b37ce6758"
BUSINESS_STUDIES="69b57619cb6f2bc86cee9150"
HORTICULTURE="6960c874f17b11250e5da33f"
HISTORIA="69b57ae7cb6f2bc86cee9747"
KISWAHILI="69c64520c34189f4c891df9f"
LEATHER_GOODS="696b32ae90be598ced92fb13"

# Book definitions: "filename|title|classLevel|subject"
BOOKS=(
  "Biology Form 1 (1).pdf|Biology Form 1|$FORM1|$BIOLOGY"
  "Biology Form 2 (1).pdf|Biology Form 2|$FORM2|$BIOLOGY"
  "CHEMISTRY FORM ONE (1).pdf|Chemistry Form 1|$FORM1|$CHEMISTRY"
  "Chemistry Form 2.pdf|Chemistry Form 2|$FORM2|$CHEMISTRY"
  "PHYSICS FORM ONE.pdf|Physics Form 1|$FORM1|$PHYSICS"
  "Physics Form 2.pdf|Physics Form 2|$FORM2|$PHYSICS"
  "Mathematics Form One (1).pdf|Mathematics Form 1|$FORM1|$MATHEMATICS"
  "Mathematics Form 2.pdf|Mathematics Form 2|$FORM2|$MATHEMATICS"
  "Geography Form One (1).pdf|Geography Form 1|$FORM1|$GEOGRAPHY"
  "GEOGRAPHY FORM TWO.pdf|Geography Form 2|$FORM2|$GEOGRAPHY"
  "Computer Science FORM 1.pdf|Computer Science Form 1|$FORM1|$COMPUTER_SCIENCE"
  "ENGLISH FORM 1.pdf|English Form 1|$FORM1|$ENGLISH"
  "ENGLISH Form Two.pdf|English Form 2|$FORM2|$ENGLISH"
  "Business studies Form 1.pdf|Business Studies Form 1|$FORM1|$BUSINESS_STUDIES"
  "HORTICULTURE FORM 1.pdf|Horticulture Form 1|$FORM1|$HORTICULTURE"
  "Historia ya Tanzania na Maadili.pdf|Historia ya Tanzania na Maadili|$FORM1|$HISTORIA"
  "KISWAHILI Kidato cha kwanza (1).pdf|Kiswahili Kidato cha Kwanza|$FORM1|$KISWAHILI"
  "LEATHER GOODS FORM 2.pdf|Leather Goods Form 2|$FORM2|$LEATHER_GOODS"
)

TOTAL=${#BOOKS[@]}
SUCCESS=0
FAILED=0

echo "========================================="
echo "Uploading $TOTAL books to production RAG"
echo "Endpoint: $API_URL/rag/documents"
echo "========================================="
echo ""

for i in "${!BOOKS[@]}"; do
  IFS='|' read -r filename title classLevel subject <<< "${BOOKS[$i]}"
  filepath="$DOWNLOADS/$filename"
  num=$((i + 1))

  if [ ! -f "$filepath" ]; then
    echo "[$num/$TOTAL] SKIP - File not found: $filename"
    FAILED=$((FAILED + 1))
    continue
  fi

  filesize=$(du -h "$filepath" | cut -f1)
  echo "[$num/$TOTAL] Uploading: $title ($filesize)..."

  RESPONSE=$(curl -s -w "\n__HTTP_STATUS__%{http_code}__TIME__%{time_total}" \
    -X POST "$API_URL/rag/documents" \
    -H "X-API-Key: $API_KEY" \
    -F "file=@$filepath" \
    -F "title=$title" \
    -F "classLevel=$classLevel" \
    -F "subject=$subject" \
    --connect-timeout 15 --max-time 600 2>&1)

  HTTP_STATUS=$(echo "$RESPONSE" | grep -o '__HTTP_STATUS__[0-9]*' | grep -o '[0-9]*')
  TIME_TAKEN=$(echo "$RESPONSE" | grep -o '__TIME__[0-9.]*' | grep -o '[0-9.]*')
  BODY=$(echo "$RESPONSE" | sed 's/__HTTP_STATUS__.*//g')

  if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
    CHUNKS=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('chunkCount', d.get('chunk_count','?')))" 2>/dev/null || echo "?")
    echo "  ✓ Success! $CHUNKS chunks indexed (${TIME_TAKEN}s)"
    SUCCESS=$((SUCCESS + 1))
  else
    echo "  ✗ Failed (HTTP $HTTP_STATUS, ${TIME_TAKEN}s)"
    echo "  Response: $(echo "$BODY" | head -c 200)"
    FAILED=$((FAILED + 1))
  fi
  echo ""
done

echo "========================================="
echo "Upload complete: $SUCCESS/$TOTAL succeeded, $FAILED failed"
echo "========================================="
