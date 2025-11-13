/**
 * Sample PDF text content extracted from IKEA kitchen planner PDFs
 * These represent the text structure after unpdf extraction
 */

/**
 * Valid kitchen planner PDF with 3 products and quantities
 * Structure: Product name, price, product code (xxx.xxx.xx), then "Nx € price"
 */
export const validKitchenPlannerPDF = `
IKEA Kitchen Planner
Shopping List

BILLY Bookcase, white
€69.99
Product code: 402.638.50
2x €139.98

KALLAX Shelf unit, white
€49.99
Product code: 003.735.89
1x €49.99

POÄNG Armchair, birch veneer
€79.99
Product code: 198.291.49
3x €239.97

Total: €429.94
`;

/**
 * PDF with decimal quantities (e.g., square meters)
 * Decimals should be rounded to nearest integer
 */
export const pdfWithDecimalQuantities = `
IKEA Kitchen Materials

LYSEKIL Wall panel, white
€25.00 per m²
Product code: 202.949.04
1.36x €34.00

EKBACKEN Countertop, white
€89.00 per m
Product code: 803.365.63
2.8x €249.20

UTBYTT Door, white
€15.00
Product code: 604.275.82
4x €60.00
`;

/**
 * PDF with missing quantity markers (should default to 1)
 */
export const pdfWithMissingQuantities = `
IKEA Shopping List

LACK Side table
€9.99
Product code: 001.042.70

MALM Bed frame
€199.99
Product code: 291.754.69
`;

/**
 * PDF with duplicate products (same code appearing multiple times)
 * Each should be counted separately based on their individual quantities
 */
export const pdfWithDuplicateProducts = `
Kitchen Cabinet Order

METOD Base cabinet
€120.00
Product code: 492.275.19
2x €240.00

Additional Items:

METOD Base cabinet
€120.00
Product code: 492.275.19
1x €120.00

Total cabinets: 3
`;

/**
 * PDF with no product codes (invalid)
 */
export const pdfWithNoProductCodes = `
IKEA Shopping List

Just some text without any valid product codes.
Some prices: €29.99, €49.99
But no product codes at all.
`;

/**
 * PDF with malformed product codes (should be ignored)
 */
export const pdfWithMalformedCodes = `
Shopping List

Product A
€19.99
Code: 12.34.56 (too short)

Product B
€29.99
Code: 1234.567.89 (wrong format)

Product C
€39.99
Code: 603.275.82 (valid!)
1x €39.99
`;

/**
 * Large PDF with many products
 */
export const largePDF = `
IKEA Complete Kitchen Order

${Array.from({ length: 20 }, (_, i) => `
Item ${i + 1}
€${(i + 1) * 10}.99
Product code: ${String(100 + i).padStart(3, '0')}.${String(200 + i).padStart(3, '0')}.${String(10 + i).padStart(2, '0')}
${i % 3 + 1}x €${((i + 1) * 10.99 * (i % 3 + 1)).toFixed(2)}
`).join('\n')}

Total: €XXXX.XX
`;

/**
 * PDF with products very far apart (>500 chars)
 * Quantity markers beyond 500 chars should not match
 */
export const pdfWithDistantQuantities = `
Product A
€29.99
Product code: 501.234.56

${'x'.repeat(600)}

This quantity is too far away:
2x €59.98

Product B (this should match)
€39.99
Product code: 602.345.67
1x €39.99
`;
