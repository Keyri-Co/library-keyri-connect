aws s3 cp index.html s3://misc.keyri.com
aws s3 cp KeyriQR.html s3://misc.keyri.com
aws cloudfront create-invalidation --distribution-id E1OF1Y01WAN2BS --paths "/"