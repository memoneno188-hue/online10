# Script to replace all Supabase imports with API client

$files = @(
  "src\pages\agents\AdditionalFees.tsx",
  "src\pages\agents\NewTrip.tsx",
  "src\pages\accounts\Treasury.tsx",
  "src\pages\agents\AddAgent.tsx",
  "src\pages\accounts\vouchers\PaymentVouchers.tsx",
  "src\pages\accounts\payroll\MonthlyPayroll.tsx",
  "src\pages\accounts\vouchers\ReceiptVouchers.tsx",
  "src\pages\accounts\payroll\EmployeeManagement.tsx",
  "src\pages\accounts\BankAccounts.tsx",
  "src\pages\invoices\ExportInvoice.tsx",
  "src\pages\reports\CustomerReports.tsx",
  "src\pages\invoices\FreeInvoice.tsx",
  "src\pages\invoices\ImportInvoice.tsx",
  "src\pages\invoices\TransitInvoice.tsx",
  "src\pages\reports\financial\BankReport.tsx",
  "src\pages\reports\financial\TreasuryReport.tsx"
)

$updated = 0
$notFound = 0

foreach ($file in $files) {
  if (Test-Path $file) {
    $content = Get-Content $file -Raw
    $newContent = $content -replace "import\s+\{[^}]*supabase[^}]*\}\s+from\s+['""]@/lib/supabase['""];?", "import { apiClient } from '@/lib/api';"
    
    if ($content -ne $newContent) {
      Set-Content $file -Value $newContent -NoNewline
      Write-Host "Updated: $file" -ForegroundColor Green
      $updated++
    } else {
      Write-Host "No change: $file" -ForegroundColor Yellow
    }
  } else {
    Write-Host "Not found: $file" -ForegroundColor Red
    $notFound++
  }
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "Updated: $updated files" -ForegroundColor Green
Write-Host "Not found: $notFound files" -ForegroundColor Red
Write-Host ""
Write-Host "Done! You can now run: npm run dev" -ForegroundColor Cyan
