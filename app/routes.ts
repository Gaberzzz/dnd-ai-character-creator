import { type RouteConfig, index } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    {
        path: "/character-generator",
        file: "routes/character-generator.tsx"
    },
    {
        path: "/api/character",
        file: "routes/api.character.tsx"
    },
    {
        path: "/form-field-extractor",
        file: "routes/form-field-extractor.tsx"
    }
] satisfies RouteConfig;
