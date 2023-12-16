import * as React from "react";
import * as P from '@shopify/polaris';
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const response = await fetch("https://dummyjson.com/products").then(response => response.json());
  return response.products;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        input: {
          title: `${color} Snowboard`,
          variants: [{ price: Math.random() * 100 }],
        },
      },
    }
  );
  const responseJson = await response.json();

  return json({
    product: responseJson.data.productCreate.product,
  });
};

export default function Index() {
  const products = useLoaderData();

  const resourceName = { singular: 'product', plural: 'products' };
  const { selectedResources, allResourcesSelected, handleSelectionChange } = P.useIndexResourceState(products);

  const rowMarkup = products.map(
    (
      { id, title, brand, stock, category, price, thumbnail, rating },
      index,
    ) => (
      <P.IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <P.IndexTable.Cell>
          <P.Text variant="bodyMd" fontWeight="bold" as="span">
            {id}
          </P.Text>
        </P.IndexTable.Cell>
        <P.IndexTable.Cell>
          <P.InlineStack blockAlign="center" gap="400">
            <P.Thumbnail
              source={thumbnail}
              size="large"
              alt="image"
            />
            <P.Text as="span" alignment="end">
              <P.Link url={`product/${id}`}>{title}</P.Link>
            </P.Text>
          </P.InlineStack>
        </P.IndexTable.Cell>
        <P.IndexTable.Cell>{brand}</P.IndexTable.Cell>
        <P.IndexTable.Cell>
          <P.Text as="span" alignment="end">
            {stock}
          </P.Text>
        </P.IndexTable.Cell>
        <P.IndexTable.Cell>
          <P.Text as="span" alignment="end">
            {category}
          </P.Text>
        </P.IndexTable.Cell>
        <P.IndexTable.Cell>
          <P.Text as="span" alignment="end">
            {rating}
          </P.Text>
        </P.IndexTable.Cell>
        <P.IndexTable.Cell>
          <P.Text as="span" alignment="end">
            ${price}
          </P.Text>
        </P.IndexTable.Cell>
      </P.IndexTable.Row>
    ),
  );

  return (
    <P.Page fullWidth title="Available Products">
      <P.Layout>
        <P.Layout.Section>
          <P.LegacyCard>
            <P.IndexTable
              resourceName={resourceName}
              itemCount={products.length}
              selectedItemsCount={
                allResourcesSelected ? 'All' : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: '#' },
                { title: 'Product' },
                { title: 'Brand' },
                { title: 'Stock', alignment: 'end' },
                { title: 'Category', alignment: 'end' },
                { title: 'Rating', alignment: 'end' },
                { title: 'Price', alignment: 'end' },
              ]}
              selectable={false}
            >
              {rowMarkup}
            </P.IndexTable>
          </P.LegacyCard>
        </P.Layout.Section>
      </P.Layout>
    </P.Page>
  );
}
