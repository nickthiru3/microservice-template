const { zfd } = require('zod-form-data');
const { z } = require('zod');
const { zodToJsonSchema } = require('zod-to-json-schema');

/**
 * Allowed file types for the deal logo.
 * @type {readonly string[]}
 */
const allowedFileTypes = ['jpg', 'jpeg', 'png', 'gif'];

/**
 * Enum values for the deal category.
 * @type {readonly string[]}
 */
const categoryEnum = [
  'foodDrink',
  'bathroom',
  'jewelery',
  'sports',
  'tech',
  'auto',
  'entertainment',
  'travel',
];

/**
 * Common schema object.
 * @type {object}
 */
const commonSchemaObject = {
  merchantId: zfd.text(z.string().min(1, 'Merchant ID is required')),
  title: zfd.text(z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less')),
  originalPrice: zfd.numeric(z.number().min(1, 'Original Price is required').positive('Original Price must be a positive number')),
  discount: zfd.numeric(z.number().min(1, 'Discount is required').max(100, 'Discount must be between 1 and 100')),
  logo: zfd.file(
    z.object({
      filename: z.string().min(1, "Filename is required"),
      contentType: z.string().refine((type) => {
        const fileType = type.split('/').pop().toLowerCase();
        return allowedFileTypes.includes(fileType);
      }, "Invalid file type"),
      data: z.instanceof(Buffer, "File data must be a buffer")
    })
  ),
  category: zfd.text(z.enum(categoryEnum, 'Category is required')),
  expiration: zfd.text(z.string().min(1, 'Expiration is required').refine((val) => !isNaN(Date.parse(val)), 'Expiration must be a valid date')),
};

/**
 * Returns the deal schema with dynamic validation for expiration date.
 * @returns {import('zod').ZodType<DealFormSchema>}
 */
function getSchema() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysFromToday = new Date(today);
  sevenDaysFromToday.setDate(today.getDate() + 7);

  return zfd.formData({
    ...commonSchemaObject,
    expiration: zfd.text(z.string().min(1, 'Expiration is required').refine(val => {
      const parsedDate = Date.parse(val);
      return !isNaN(parsedDate) && new Date(parsedDate) >= sevenDaysFromToday;
    }, 'Expiration must be seven days from today or later')),
  });
};

function validate(data) {
  const result = getSchema().safeParse(data);
  if (!result.success) {
    const detailedErrors = result.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));

    throw new Error(`Validation failed: ${JSON.stringify(detailedErrors, null, 2)}`);
  }

  return result.data;
}

/**
 * Static schema for API Gateway validation.
 * This schema doesn't include the dynamic check for expiration date.
 */
const staticSchema = zfd.formData(commonSchemaObject);

/**
 * JSON schema for the deal.
 */
const jsonSchema = zodToJsonSchema(staticSchema, {
  $refStrategy: 'none',
  target: 'openApi3',
});

module.exports = {
  validate,
  jsonSchema
};