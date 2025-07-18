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
 * Returns the deal schema with dynamic validation for expiration date.
 * @returns {import('zod').ZodType<DealFormSchema>}
 */
const schema = zodToJsonSchema(
  zfd.formData({
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
  }),
  {
    $refStrategy: 'none',
    target: 'openApi3',
  }
);

module.exports = schema;