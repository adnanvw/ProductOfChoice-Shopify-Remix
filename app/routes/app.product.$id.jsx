import * as P from '@shopify/polaris';
import { useLoaderData, useSubmit, useActionData } from "@remix-run/react";
import { authenticate } from '../shopify.server';
import { useEffect, useState } from 'react';

export async function loader({ request }) {
    const url = new URL(request.url);
    const product_id = url.pathname.replace("/app/product/", "");

    const response = await fetch(`https://dummyjson.com/products/${product_id}`).then(response => response.json());
    return response;
}

export async function action({ request }) {
    const { admin } = await authenticate.admin(request);
    const body = await request.formData();
    const image_arr = [];

    for (let i = 0; i < body.get("images").split(",").length; i++) {
        image_arr.push({
            originalSource: body.get("images").split(",")[i],
            alt: body.get("title"),
            mediaContentType: "IMAGE"
        });
    }

    await admin.graphql(
        `#graphql
        mutation CreateProductWithNewMedia($input: ProductInput!, $media: [CreateMediaInput!]) {
            productCreate(input: $input, media: $media) {
                product {
                    id
                    title
                }
                userErrors {
                    field
                    message
                }
            }
        }`,
        {
            variables: {
                input: {
                    title: body.get("title"),
                    bodyHtml: `<p>${body.get("description")}</p>`,
                    tags: [body.get("category")],
                    vendor: body.get("brand"),
                    variants: [
                        {
                            price: Number(body.get("price")),
                        }
                    ],
                },
                "media": image_arr
            },
        }
    );

    return true;
}

export default function ProductDetails() {
    const product = useLoaderData();
    const submit = useSubmit();
    const status = useActionData();

    useEffect(() => {
        if (status == true) {
            alert("Product successfully added to the store.");
        }
    }, [status]);

    const [loading, setLoading] = useState(false);

    return (
        <P.Page
            backAction={{ content: 'Go Back', url: '/app' }}
            title={product.title}
            primaryAction={
                <P.Button
                    loading={loading}
                    variant="primary"
                    onClick={handleSubmit}>
                    Add Product to Store
                </P.Button>
            }
        >
            <P.LegacyCard title="Product Details" sectioned>
                <P.TextField
                    label="Title"
                    value={product.title}
                    readOnly
                    autoComplete="off"
                />
                <br />
                <P.TextField
                    label="Description"
                    value={product.description}
                    readOnly
                    autoComplete="off"
                />
                <br />
                <P.TextField
                    label="Brand"
                    value={product.brand}
                    readOnly
                    autoComplete="off"
                />
                <br />
                <P.TextField
                    label="Category"
                    value={product.category}
                    readOnly
                    autoComplete="off"
                />
                <br />
                <P.TextField
                    prefix="$"
                    label="Price"
                    value={product.price}
                    readOnly
                    autoComplete="off"
                />
                <br />
            </P.LegacyCard>

            <P.LegacyCard title="Product Media" sectioned>
                {
                    product.images.map((img, index) => {
                        return <img key={index} src={img} width={"50%"} alt="img" />
                    })
                }
            </P.LegacyCard>
        </P.Page >
    )

    async function handleSubmit() {
        setLoading(true);
        submit(
            { ...product },
            { replace: true, method: "POST" }
        );
        setLoading(false);
    }
}