import { AlertCircle } from "lucide-react";
import type React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SaasProduct } from "../../types/schema";

interface SaasProductSelectionProps {
  saasProducts: SaasProduct[];
  selectedSaas: string;
  onSelectSaas: (value: string) => void;
}

export const SaasProductSelection: React.FC<SaasProductSelectionProps> = ({
  saasProducts,
  onSelectSaas,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Select SaaS Product</CardTitle>
        <CardDescription>
          Choose the SaaS product you want to submit
        </CardDescription>
      </CardHeader>
      <CardContent>
        {saasProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">No SaaS products found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Please add a SaaS product first before submitting
            </p>
          </div>
        ) : (
          <Select onValueChange={onSelectSaas}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a SaaS Product" />
            </SelectTrigger>
            <SelectContent>
              {saasProducts.map((saas) => (
                <SelectItem key={saas.id} value={saas.id.toString()}>
                  {saas.name} - {saas.website_url}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardContent>
    </Card>
  );
};
